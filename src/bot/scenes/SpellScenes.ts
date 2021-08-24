import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/src/core/types/typegram';
import got from 'got';
import * as HTMLParser from 'node-html-parser';
import IBot from '../../types/bot';
import MetricsQueries from '../../db/queries/MetricsQueries';

export default class SpellScenes {
    static BASE_URL = 'https://dungeon.su'

    private static ACTIONS = {
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
            try {
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
                    // eslint-disable-next-line no-param-reassign
                    ctx.scene.session.spellName = ctx.message.text;

                    const { spellName } = ctx.scene.session;
                    const grabResult: HTMLParser.HTMLElement[] = await SpellScenes.grabSpellList(spellName);

                    let spellList = [] as IBot.ISpell[];

                    if (grabResult.length > 0 && grabResult.length < 10) {
                        spellList = await SpellScenes.parseGrabbedSpellList(grabResult);

                        if (!process.env.DEBUG_MODE || process.env.DEBUG_MODE !== 'true') {
                            await MetricsQueries.checkAndUpdateTodayMetrics(ctx.message.from.id, spellList.length);
                        }
                    }

                    if (spellList.length === 1) {
                        const msg = SpellScenes.formatSpellMessage(spellList[0]);

                        await ctx.replyWithHTML(msg);

                        await ctx.scene.leave();
                    } else if (spellList.length > 1 && spellList.length <= 10) {
                        // eslint-disable-next-line no-param-reassign
                        ctx.scene.session.previousSpells = spellList;

                        await ctx.reply(
                            // eslint-disable-next-line max-len
                            `Я нашел несколько заклинаний, где упоминается "${spellName}".\nВыбери подходящее из этого списка:`,
                            SpellScenes.getSpellListMarkup(spellList)
                        );
                    } else if (spellList.length > 10) {
                        await ctx.reply(`Я нашел слишком много заклинаний, где упоминается "${spellName}"...`);

                        await ctx.scene.reenter();
                    } else {
                        await ctx.reply('Я не смог найти такое заклинание...');

                        await ctx.scene.reenter();
                    }
                }
            } catch (err) {
                console.error(err);

                await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз');

                await ctx.scene.leave();
            }
        });

        scene.action(new RegExp('.*'), async (ctx, next) => {
            await ctx.answerCbQuery();

            await next();
        });

        scene.action(new RegExp(`^${SpellScenes.ACTIONS.findByID} (.+)`), async ctx => {
            const { previousSpells } = ctx.scene.session;
            const spell = previousSpells.find(item => String(item.name) === ctx.match[1]) as IBot.ISpell;
            const msg = SpellScenes.formatSpellMessage(spell);

            await ctx.deleteMessage();
            await ctx.replyWithHTML(msg, Markup.inlineKeyboard([
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

    static formatSpellMessage = (spell: IBot.ISpell): string => {
        const { el } = spell;
        const params = el.querySelector('ul.params').querySelectorAll('li');

        let reply = `<b>${el.querySelector('a.item-link').innerText}</b>`;

        for (let i = 0; i < params.length; i++) {
            const li: HTMLParser.HTMLElement = params[i];

            if (li.classList.contains('size-type-alignment')) {
                reply += `\n<i>${li.innerText}</i>\n`;
            } else if (li.classList.contains('subsection') && li.classList.contains('desc')) {
                const paragraphs = li.querySelectorAll('p');

                reply += '\n';

                for (let i1 = 0; i1 < paragraphs.length; i1++) {
                    const p = paragraphs[i1];

                    reply += `\n${p.innerText}`;
                }
            } else {
                const label = li.querySelector('strong');

                if (label) {
                    reply += `\n<b>${label.innerText}</b> ${li.innerText.replace(label.innerText, '').trim()}`;
                }
            }
        }

        reply += `\n\n<b>Источник:</b> ${spell.url}`

        return reply
    }

    static getSpellListMarkup = (spellList: IBot.ISpell[]): Markup.Markup<InlineKeyboardMarkup> => {
        // eslint-disable-next-line max-len
        const spellButtons = spellList.map(spell => [Markup.button.callback(spell.name, `${SpellScenes.ACTIONS.findByID} ${spell.name}`)]);

        return Markup.inlineKeyboard([
            ...spellButtons,
            SpellScenes.EXIT_BUTTON
        ]);
    }

    static grabSpellList = async (spellName: string): Promise<HTMLParser.HTMLElement[]> => {
        const url = `${ SpellScenes.BASE_URL }/spells/level/`;
        const response = await got.get(url, { searchParams: { partner: 'svifty7' }});
        const dom = HTMLParser.parse(response.body);
        const container = dom.querySelector('.list-of-items')
        const spellLinks = container.querySelectorAll('a');

        return spellLinks.filter(spell => spell.innerText.match(new RegExp(spellName, 'gi')));
    }

    static parseGrabbedSpellList = async (list: HTMLParser.HTMLElement[]): Promise<IBot.ISpell[]> => {
        const spellList = [] as IBot.ISpell[];

        for (const element of list) {
            const url: string | undefined = element.getAttribute('href')
                ? `${ SpellScenes.BASE_URL }${ element.getAttribute('href') }`
                : undefined;

            if (url) {
                const el = await SpellScenes.grabSpellInfo(url);

                spellList.push({
                    name: element.innerText,
                    url,
                    el
                })
            }
        }

        return spellList
    }

    static grabSpellInfo = async (url: string): Promise<HTMLParser.HTMLElement> => {
        const response = await got.get(url, { searchParams: { partner: 'svifty7' }});
        const dom = HTMLParser.parse(response.body);

        return dom.querySelector('.paper-1.card');
    }
}
