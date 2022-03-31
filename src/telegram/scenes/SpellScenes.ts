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
import BaseHandler from '../utils/BaseHandler';
import TelegrafHelpers from '../utils/TelegrafHelpers';

enum ACTIONS {
    ExitFromSearch = 'exitFromSearch',
}

const scene = new BaseScene<IBot.TContext>('findSpell');
const http: HTTPService = new HTTPService();
const spellsMiddleware = new SpellsMiddleware();

const EXIT_BUTTON: CallbackButton[] = [
    Markup.callbackButton('Закончить поиск заклинания', ACTIONS.ExitFromSearch)
];

const LEAVE_MSG = 'вышел(а) из режима поиска заклинания';

const getSpellListKeyboard = (spellList: NSpell.ISpell[]) => Markup.keyboard([
    ...spellList.map(spell => [ Markup.button(`${ spell.name } [${ spell.englishName }]`) ])
]);

const sendSpellMessage = async (ctx: IBot.TContext, spell: NSpell.ISpell) => {
    const { messages, url } = spellsMiddleware.getSpellMessage(spell);

    try {
        for (let i = 0; i < messages.length; i++) {
            let extra: Extra = {
                reply_to_message_id: ctx.message?.message_id,
                disable_web_page_preview: true,
                disable_notification: true,
            };

            if (i === messages.length - 1) {
                extra = {
                    ...extra,
                    reply_markup: {
                        ...Markup.inlineKeyboard([
                            [ Markup.urlButton('Оригинал на D&D5 Club', url) ],
                            EXIT_BUTTON
                        ])
                    },
                }
            }

            await ctx.replyWithHTML(messages[i], extra);
        }
    } catch (err) {
        console.error(err);

        for (let i = 0; i < messages.length; i++) {
            const extra: Extra = {
                reply_to_message_id: ctx.message?.message_id,
                disable_web_page_preview: true,
                disable_notification: true,
            };

            await ctx.reply(messages[i], extra);
        }

        await ctx.reply('Произошла ошибка, поэтому я выслал тебе сырую версию сообщения заклинания... '
            + 'пожалуйста, сообщи нам об этом в Discord', {
            reply_markup: Markup.inlineKeyboard([[
                Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z')
            ]]),
            disable_notification: true,
        });

        await BaseHandler.leaveScene(ctx, LEAVE_MSG);
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
    const userName = TelegrafHelpers.getUserMentionHTMLString(ctx);

    await ctx.replyWithHTML(`${ userName } вошел(ла) в режим поиска заклинаний.`
        + '\n\nВведи название заклинания (минимум 3 буквы)', {
        reply_to_message_id: ctx.message?.message_id,
        disable_notification: true,
        reply_markup: Markup.inlineKeyboard([ EXIT_BUTTON ]),
    });
});

scene.on('text', async ctx => {
    try {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Произошла какая-то ошибка...');

            await ctx.scene.reenter();

            return;
        }

        if (ctx.message.text.length < 3) {
            await ctx.reply('Название слишком короткое', {
                reply_to_message_id: ctx.message.message_id,
                disable_notification: true,
            });

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
                + ' попробуй уточнить название',
                {
                    reply_to_message_id: ctx.message.message_id,
                    disable_notification: true,
                }
            );

            return;
        }

        if (spellList.length > 1) {
            // eslint-disable-next-line no-param-reassign
            ctx.scene.session.state.spellList = spellList;

            await ctx.replyWithHTML(`Я нашел несколько заклинаний, где упоминается <b>«${ value }»</b>`, {
                reply_to_message_id: ctx.message?.message_id,
                disable_notification: true,
                reply_markup: {
                    ...getSpellListKeyboard(spellList),
                    input_field_placeholder: 'Название...',
                    selective: true,
                    resize_keyboard: true
                },
            });

            await ctx.reply('Выбери подходящее из этого списка', {
                reply_markup: Markup.inlineKeyboard([ EXIT_BUTTON ]),
                disable_notification: true
            });

            return;
        }

        await ctx.reply('Я не смог найти такое заклинание... попробуй другое название', {
            reply_to_message_id: ctx.message.message_id,
            disable_notification: true,
        });
    } catch (err) {
        console.error(err);

        await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз', {
            reply_to_message_id: ctx.message?.message_id,
            disable_notification: true,
        });

        await BaseHandler.leaveScene(ctx, LEAVE_MSG);
    }
});

scene.action(ACTIONS.ExitFromSearch, async ctx => {
    await ctx.answerCbQuery();

    await BaseHandler.leaveScene(ctx, LEAVE_MSG);
});

export default scene;
