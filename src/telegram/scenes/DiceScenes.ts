import { BaseScene, Markup } from 'telegraf';
import { Button } from 'telegraf/typings/markup';
import IBot from '../../../typings/TelegramBot';
import DiceRollerMiddleware from '../../middlewares/DiceRollerMiddleware';
import BaseHandler from '../utils/BaseHandler';
import TelegrafHelpers from '../utils/TelegrafHelpers';

enum ACTIONS {
    ExitFromRoller = '❌ Закончить броски',
}

const EXIT_BUTTON: Button[] = [ Markup.button(ACTIONS.ExitFromRoller) ];

const LEAVE_MSG = 'закончил(а) бросать кубики';

const getDiceKeyboard = () => ([
    EXIT_BUTTON,
    [
        Markup.button('d2'),
        Markup.button('d4'),
        Markup.button('d6'),
        Markup.button('d8')
    ],
    [
        Markup.button('d10'),
        Markup.button('d12')
    ],
    [
        Markup.button('пом'),
        Markup.button('d20'),
        Markup.button('пре')
    ]
])

const scene = new BaseScene<IBot.TContext>('diceRoll');
const diceRoll = new DiceRollerMiddleware();

scene.enter(async ctx => {
    const userName = TelegrafHelpers.getUserMentionHTMLString(ctx);

    await ctx.replyWithHTML(`${ userName } вошел(ла) в режим броска кубиков.`
        + '\n\nВыбирай кубик на клавиатуре или отправь мне формулу', {
        reply_to_message_id: ctx.message?.message_id,
        disable_notification: true,
        reply_markup: {
            keyboard: getDiceKeyboard(),
            input_field_placeholder: 'Напр., «2d20»...',
            resize_keyboard: true,
            selective: true,
        },
    });

    await ctx.reply('Держи ссылку на подсказку, чтобы знать как пишутся формулы ☺️', {
        reply_to_message_id: ctx.message?.message_id,
        disable_notification: true,
        reply_markup: {
            ...Markup.inlineKeyboard([[
                Markup.urlButton(
                    'Подсказка',
                    'https://dnd5.club/telegram_bot'
                )
            ]])
        },
    })
});

scene.on('text', async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply('Произошла какая-то ошибка...', {
            disable_notification: true,
        });

        await ctx.scene.reenter();

        return;
    }

    if (ctx.message.text === ACTIONS.ExitFromRoller) {
        await BaseHandler.leaveScene(ctx, LEAVE_MSG);

        return;
    }

    try {
        const msg = await diceRoll.getDiceMsg(ctx.message.text);

        if (!msg) {
            await ctx.reply('Произошла ошибка... попробуй еще раз или напиши нам в Discord-канал', {
                reply_to_message_id: ctx.message.message_id,
                disable_notification: true,
                reply_markup: Markup.inlineKeyboard([
                    [ Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z') ]
                ]),
            });

            return;
        }

        await ctx.replyWithHTML(msg, {
            reply_to_message_id: ctx.message.message_id,
            disable_notification: true,
        });
    } catch (err) {
        await ctx.reply('В формуле броска кубиков ошибка.\n\nНе забывай про подсказку, если не получается', {
            reply_to_message_id: ctx.message.message_id,
            disable_notification: true,
            reply_markup: Markup.inlineKeyboard([[
                Markup.urlButton(
                    'Подсказка',
                    'https://dice-roller.github.io/documentation/guide/notation/'
                )
            ]]),
        });
    }
});

export default scene
