import { BaseScene, Markup } from 'telegraf';
import { Button } from 'telegraf/typings/markup';
import { stripHtml } from 'string-strip-html';
import IBot from '../../../typings/TelegramBot';
import NSpell from '../../../typings/Spell';
import TContext = IBot.TContext;
import HTTPService from '../../utils/HTTPService';

enum ACTIONS {
    ExitFromSearch = 'Закончить поиск заклинания'
}

export default class SpellScenes {
    private EXIT_BUTTON: Button[] = [
        Markup.button('Закончить поиск заклинания')
    ];

    private readonly http: HTTPService = new HTTPService();

    public findSpell() {
        const scene = new BaseScene<TContext>('findSpell');

        scene.enter(async ctx => {
            await ctx.reply(
                'Введи название заклинания (минимум 3 буквы)',
                Markup.keyboard([ this.EXIT_BUTTON ]).extra()
            );
        });

        scene.on('text', async ctx => {
            try {
                if (!ctx.message || !('text' in ctx.message)) {
                    await ctx.reply('Произошла какая-то ошибка...', {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });

                    await ctx.scene.reenter();

                    return;
                }

                if (ctx.message.text.length < 3) {
                    await ctx.reply('Название слишком короткое', {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });

                    await ctx.scene.reenter();

                    return;
                }

                if (ctx.message.text === ACTIONS.ExitFromSearch) {
                    await this.leaveScene(ctx);

                    return;
                }

                // eslint-disable-next-line no-param-reassign
                ctx.scene.session.state.searchStr = ctx.message.text;

                const { searchStr } = ctx.scene.session.state;
                const match = searchStr.match(/(?<spellName>.+?)(\[.+?])$/i);

                if (ctx.scene.session.state?.spellList?.length && match?.groups?.spellName) {
                    const spell = ctx.scene.session.state.spellList
                        .find((item: NSpell.ISpell) => item.name === match.groups.spellName.trim());

                    const spellMsg: string = this.getSpellMessage(spell);

                    await ctx.replyWithHTML(spellMsg, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                    await ctx.scene.leave();

                    return;
                }

                const spellList: NSpell.ISpell[] = await this.http.post('/spells', {
                    search: searchStr as string
                });

                let spell: NSpell.ISpell | undefined;

                if (spellList.length === 1) {
                    [ spell ] = spellList;

                    const spellMsg: string = this.getSpellMessage(spell);

                    await ctx.replyWithHTML(spellMsg);
                    await ctx.scene.leave();

                    return;
                }

                if (spellList.length > 1) {
                    // eslint-disable-next-line no-param-reassign
                    ctx.scene.session.state.spellList = spellList;

                    await ctx.reply(
                        // eslint-disable-next-line max-len
                        `Я нашел несколько заклинаний, где упоминается "${ searchStr }".\nВыбери подходящее из этого списка:`,
                        this.getSpellListMarkup(spellList)
                    );

                    return;
                }

                // if (spellList.length > 10) {
                //     await ctx.reply(`Я нашел слишком много заклинаний, где упоминается "${ spellName }"...`);
                //
                //     await ctx.scene.reenter();
                //
                //     return;
                // }

                await ctx.reply('Я не смог найти такое заклинание...');

                await ctx.scene.reenter();
            } catch (err) {
                console.error(err);

                await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз');

                await ctx.scene.leave();
            }
        });

        scene.on('message', async ctx => {
            await ctx.reply('Это не похоже на название заклинания 🙃');

            await ctx.scene.reenter();
        })

        return scene;
    }

    private leaveScene = async (ctx: IBot.TContext) => {
        await ctx.reply('Ты вышел из режима поиска заклинания', {
            reply_markup: {
                remove_keyboard: true
            }
        });

        await ctx.scene.leave();
    }

    private getSpellMessage = (spell: NSpell.ISpell): string => {
        let msg = `${spell.name} [${spell.englishName}]\n`;

        msg += `\n<b>Источник:</b> ${spell.source}`
        msg += `\n<b>Уровень:</b> ${spell.level}`;
        msg += `\n<b>Школа:</b> ${spell.school}`;

        for (let i = 0; i < spell.entries.length; i++) {
            if (!i) {
                msg += '\n';
            }

            msg += `\n${stripHtml(spell.entries[i], {
                ignoreTags: [ 'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'a', 'code', 'pre' ]
            }).result}`;
        }

        msg += `\n\n<b>Источник:</b> ${process.env.SITE_URL}/spells/${spell.englishName.replaceAll(' ', '_')}`

        return msg
    }

    private getSpellListMarkup = (spellList: NSpell.ISpell[]) => {
        const spellButtons = spellList
            .map(spell => [ Markup.button(`${spell.name} [${spell.englishName}]`) ]);

        return Markup.keyboard([
            ...spellButtons,
            this.EXIT_BUTTON
        ]).extra();
    }
}
