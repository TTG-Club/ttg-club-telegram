import {
    BaseScene,
    Markup
} from 'telegraf';
import { Extra } from 'telegraf/typings/telegram-types';
import { CallbackButton } from 'telegraf/typings/markup';
import IBot from '../../../typings/TelegramBot';
import NSpell from '../../../typings/Spell';
import HTTPService from '../../utils/HTTPService';
import SpellsMiddleware from '../../middlewares/SpellsMiddleware';

enum ACTIONS {
    ExitFromSearch = 'exitFromSearch',
}

const scene = new BaseScene<IBot.TContext>('findSpell');
const http: HTTPService = new HTTPService();
const spellsMiddleware = new SpellsMiddleware();

const EXIT_BUTTON: CallbackButton[] = [
    Markup.callbackButton('Закончить поиск заклинания', ACTIONS.ExitFromSearch)
];

const leaveScene = async (ctx: IBot.TContext) => {
    await ctx.reply('Ты вышел из режима поиска заклинания', {
        reply_markup: {
            remove_keyboard: true
        }
    });

    await ctx.scene.leave();
}

const getSpellListMarkup = (spellList: NSpell.ISpell[]) => Markup.keyboard(
    [ ...spellList.map(spell => [ Markup.button(`${ spell.name } [${ spell.englishName }]`) ]) ]
);

const sendSpellMessage = async (ctx: IBot.TContext, spell: NSpell.ISpell) => {
    const { messages, url } = spellsMiddleware.getSpellMessage(spell);

    try {
        for (let i = 0; i < messages.length; i++) {
            let extra: Extra = {
                disable_web_page_preview: true
            };

            if (i === messages.length - 1) {
                extra = {
                    ...extra,
                    reply_markup: {
                        ...Markup.inlineKeyboard([
                            [ Markup.urlButton('Оригинал на D&D5 Club', url) ],
                            EXIT_BUTTON
                        ])
                    }
                }
            }

            await ctx.replyWithHTML(messages[i], extra);
        }
    } catch (err) {
        console.error(err);

        for (let i = 0; i < messages.length; i++) {
            let extra: Extra = {
                disable_web_page_preview: true
            };

            if (i === messages.length - 1) {
                extra = {
                    ...extra,
                    reply_markup: { remove_keyboard: true }
                }
            }

            await ctx.reply(messages[i], extra);
        }

        await ctx.reply('Произошла ошибка, поэтому я выслал тебе сырую версию сообщения заклинания... '
            + 'пожалуйста, сообщи нам об этом в Discord', {
            reply_markup: {
                ...Markup.inlineKeyboard([[
                    Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z')
                ]])
            }
        });
        await leaveScene(ctx);
    }
}

const trySendSpellFromSession = async (ctx: IBot.TContext, name: string) => {
    if (
        ctx.scene.session.state?.spellList?.length
        && name
    ) {
        const spell = ctx.scene.session.state.spellList
            .find((item: NSpell.ISpell) => item.name === name);

        if (!spell) {
            return false;
        }

        await sendSpellMessage(ctx, spell);

        return true
    }

    return false
}

scene.enter(async ctx => {
    await ctx.reply(
        'Введи название заклинания (минимум 3 буквы)',
        Markup.inlineKeyboard([ EXIT_BUTTON ]).extra()
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

        if (ctx.message.text === 'Закончить поиск заклинания') {
            await leaveScene(ctx);

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

        const input: string = ctx.message.text.trim();
        const match = input.match(/(?<spellName>.+?)(\[.+?])$/i);
        const matchedName = match?.groups?.spellName?.trim();

        // eslint-disable-next-line no-param-reassign
        ctx.scene.session.state.searchStr = ctx.message.text.trim();

        if (!!matchedName && await trySendSpellFromSession(ctx, matchedName)) {
            return;
        }

        const value: string = matchedName || input;
        const apiOptions: NSpell.IRequest = {
            search: {
                exact: !!matchedName,
                value
            },
            order: [{
                field: 'level',
                direction: 'asc'
            }, {
                field: 'name',
                direction: 'asc'
            }]
        };
        const spellList: NSpell.ISpell[] = await http.post('/spells', apiOptions);

        let spell: NSpell.ISpell | undefined;

        if (spellList.length === 1) {
            [ spell ] = spellList;

            await sendSpellMessage(ctx, spell)

            return;
        }

        if (spellList.length > 10) {
            await ctx.replyWithHTML(
                `Я нашел слишком много заклинаний, где упоминается <b>«${ value }»</b>...`
                + 'попробуй уточнить название',
                {
                    reply_markup: { remove_keyboard: true }
                }
            );

            await ctx.scene.reenter();

            return;
        }

        if (spellList.length > 1) {
            // eslint-disable-next-line no-param-reassign
            ctx.scene.session.state.spellList = spellList;

            await ctx.replyWithHTML(
                // eslint-disable-next-line max-len
                `Я нашел несколько заклинаний, где упоминается <b>«${ value }»</b>`,
                getSpellListMarkup(ctx.scene.session.state.spellList).extra()
            );

            await ctx.reply('Выбери подходящее из этого списка', {
                reply_markup: {
                    ...Markup.inlineKeyboard([ EXIT_BUTTON ])
                }
            })

            return;
        }

        await ctx.reply('Я не смог найти такое заклинание...');

        await ctx.scene.reenter();
    } catch (err) {
        console.error(err);

        await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз', {
            reply_markup: {
                remove_keyboard: true
            }
        });

        await leaveScene(ctx);
    }
});

scene.action(ACTIONS.ExitFromSearch, async ctx => {
    await ctx.answerCbQuery();

    await ctx.reply('Ты вышел из режима поиска заклинания', {
        reply_markup: {
            remove_keyboard: true
        }
    });

    await ctx.scene.leave();
});

scene.on('message', async ctx => {
    await ctx.reply('Это не похоже на название заклинания 🙃');

    await ctx.scene.reenter();
});

export default scene;
