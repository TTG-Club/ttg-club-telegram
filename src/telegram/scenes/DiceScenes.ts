import { BaseScene, Markup } from 'telegraf';
import { CallbackButton } from 'telegraf/typings/markup';
import IBot from '../../../typings/TelegramBot';
import DiceRollerMiddleware from '../../middlewares/DiceRollerMiddleware';
import BaseHandler from '../utils/BaseHandler';
import TelegrafHelpers from '../utils/TelegrafHelpers';

enum ACTIONS {
    ExitFromRoller = 'exitFromDice',
}

const EXIT_BUTTON: CallbackButton[] = [ Markup.callbackButton('Закончить броски', ACTIONS.ExitFromRoller) ];

const LEAVE_MSG = 'закончил(а) бросать кубики';

const getDiceKeyboard = () => Markup.keyboard([
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
        reply_markup: {
            ...getDiceKeyboard(),
            input_field_placeholder: 'Напр., «2d20»...',
            resize_keyboard: true,
            selective: true,
        },
        reply_to_message_id: ctx.message?.message_id,
        disable_notification: true
    });

    await ctx.reply('Держи ссылку на подсказку, чтобы знать как пишутся формулы ☺️', {
        reply_markup: {
            ...Markup.inlineKeyboard([[
                Markup.urlButton(
                    'Dice Roller',
                    'https://dice-roller.github.io/documentation/guide/notation/'
                )
            ], EXIT_BUTTON ])
        },
        disable_notification: true
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

    try {
        const msg = await diceRoll.getDiceMsg(ctx.message.text);

        if (!msg) {
            await ctx.reply('Произошла ошибка... попробуй еще раз или напиши нам в Discord-канал', {
                reply_markup: Markup.inlineKeyboard([
                    [ Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z') ]
                ]),
                disable_notification: true,
            });

            return;
        }

        await ctx.replyWithHTML(msg, {
            reply_markup: Markup.inlineKeyboard([ EXIT_BUTTON ]),
            disable_notification: true,
        });
    } catch (err) {
        await ctx.reply('В формуле броска кубиков ошибка.\n\nНе забывай про подсказку, если не получается', {
            reply_markup: Markup.inlineKeyboard([[
                Markup.urlButton(
                    'Dice Roller',
                    'https://dice-roller.github.io/documentation/guide/notation/'
                )
            ], EXIT_BUTTON ]),
            disable_notification: true,
        });
    }
});

scene.action(ACTIONS.ExitFromRoller, async ctx => {
    await ctx.answerCbQuery();

    await BaseHandler.leaveScene(ctx, LEAVE_MSG);
})

export default scene
