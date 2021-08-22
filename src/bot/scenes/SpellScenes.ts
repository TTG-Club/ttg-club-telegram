import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/src/core/types/typegram';
import SpellQueries from '../../db/queries/SpellQueries';
import IDB from '../../types/db';
import StringManipulation from '../../helpers/StringManipulation';
import IBot from '../../types/bot';

export default class SpellScenes {
    static ACTIONS = {
        findByID: 'FIND_BY_ID',
        showFounded: 'SHOW_FOUNDED',
        exitFromSearch: 'EXIT_FROM_SEARCH'
    }

    static EXIT_BUTTON = [Markup.button.callback('Закончить поиск заклинания', SpellScenes.ACTIONS.exitFromSearch)];

    static findSpell(): Scenes.BaseScene<IBot.IContext> {
        const scene = new Scenes.BaseScene<IBot.IContext>('findSpell');

        scene.enter(async ctx => {
            await ctx.reply(
                'Введи название заклинания (минимум 3 буквы)',
                Markup.inlineKeyboard([SpellScenes.EXIT_BUTTON])
            );
        });

        scene.on('text', async ctx => {
            if (!ctx.message || !('text' in ctx.message)) {
                await ctx.reply(
                    'Произошла какая-то ошибка...',
                    Markup.inlineKeyboard([SpellScenes.EXIT_BUTTON])
                );

                await ctx.scene.reenter();
            } else if (ctx.message.text.length < 3) {
                await ctx.reply(
                    'Название слишком короткое',
                    Markup.inlineKeyboard([SpellScenes.EXIT_BUTTON])
                );

                await ctx.scene.reenter();
            } else {
                try {
                    // eslint-disable-next-line no-param-reassign
                    ctx.scene.session.spellName = ctx.message.text;

                    const { spellName } = ctx.scene.session;
                    const spellList = await SpellQueries.getSpellListByName(spellName);

                    if (spellList.length === 1) {
                        const msg = SpellScenes.formatSpellMessage(spellList[0])

                        await ctx.replyWithHTML(msg);

                        await ctx.scene.leave();
                    } else if (spellList.length > 1 && spellList.length < 21) {
                        // eslint-disable-next-line no-param-reassign
                        ctx.scene.session.previousSpells = spellList;

                        await ctx.reply(
                            // eslint-disable-next-line max-len
                            `Я нашел несколько заклинаний, где упоминается "${spellName}".\nВыбери подходящее из этого списка:`,
                            SpellScenes.getSpellListMarkup(spellList)
                        );
                    } else if (spellList.length > 20) {
                        await ctx.reply(`Я нашел слишком много заклинаний, где упоминается "${spellName}"...`);

                        await ctx.scene.reenter();
                    } else {
                        await ctx.reply('Я не смог найти такое заклинание...');

                        await ctx.scene.reenter();
                    }
                } catch (err) {
                    console.error(err);

                    await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз');

                    await ctx.scene.leave();
                }
            }
        });

        scene.action(new RegExp('.*'), async (ctx, next) => {
            await ctx.answerCbQuery();

            await next();
        });

        scene.action(new RegExp(`^${SpellScenes.ACTIONS.findByID} (.+)`), async ctx => {
            const { previousSpells } = ctx.scene.session;
            const spell = previousSpells.find(item => String(item._id) === ctx.match[1]) as IDB.ISpell;
            const msg = SpellScenes.formatSpellMessage(spell);

            await ctx.editMessageText(msg, Markup.inlineKeyboard([
                [Markup.button.callback('Вернуться к результатам', SpellScenes.ACTIONS.showFounded)],
                SpellScenes.EXIT_BUTTON
            ]));
        });

        scene.action(SpellScenes.ACTIONS.showFounded, async ctx => {
            const { spellName, previousSpells } = ctx.scene.session;

            await ctx.editMessageText(
                `Я нашел несколько заклинаний, где упоминается "${spellName}".\nВыбери подходящее из этого списка:`,
                SpellScenes.getSpellListMarkup(previousSpells)
            );
        })

        scene.action(SpellScenes.ACTIONS.exitFromSearch, async ctx => {
            await ctx.editMessageReplyMarkup(undefined);
            await ctx.reply('Ты вышел из режима поиска заклинания');

            await ctx.scene.leave();
        });

        scene.on('message', async ctx => {
            await ctx.reply('Это не похоже на название заклинания 🙃');
            await ctx.scene.reenter();
        })

        return scene;
    }

    static formatSpellMessage = (spell: IDB.ISpell): string => {
        const spellLevel: string = 'level' in spell && spell.level ? `${spell.level} уровень` : 'Заговор';

        let reply = `${StringManipulation.capitalizeFirstLetter(spell.name)} (${spellLevel})\n`;

        if ('source' in spell && spell.source) {
            reply += `\nИсточник: ${spell.source};`;
        }

        if ('school' in spell && spell.school) {
            reply += `\nШкола: ${spell.school};`;
        }

        if ('castingTime' in spell && spell.castingTime) {
            reply += `\nВремя применения: ${spell.castingTime};`;
        }

        if ('duration' in spell && spell.duration) {
            reply += `\nДлительность: ${spell.duration};`;
        }

        if ('range' in spell && spell.range) {
            reply += `\nДальность: ${spell.range};\n`;
        }

        if ('materials' in spell && spell.materials) {
            reply += `\nМатериалы: ${spell.materials};\n`;
        }

        if ('text' in spell && spell.text) {
            reply += `\n${spell.text}`;
        }

        return reply
    }

    static getSpellListMarkup = (spellList: IDB.ISpell[]): Markup.Markup<InlineKeyboardMarkup> => {
        // eslint-disable-next-line max-len
        const spellButtons = spellList.map(spell => [Markup.button.callback(spell.name, `${SpellScenes.ACTIONS.findByID} ${spell._id}`)]);

        return Markup.inlineKeyboard([
            ...spellButtons,
            SpellScenes.EXIT_BUTTON
        ]);
    }
}
