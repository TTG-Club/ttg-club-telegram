import { BaseScene, Markup } from 'telegraf';
import { Button, CallbackButton } from 'telegraf/typings/markup';
import IBot from '../../../typings/TelegramBot';
import DiceRollerMiddleware from '../../middlewares/DiceRollerMiddleware';

enum ACTIONS {
    ExitFromRoller = 'exitFromDice',
}

const EXIT_BUTTON: CallbackButton[] = [ Markup.callbackButton('Закончить броски', ACTIONS.ExitFromRoller) ];

const getDiceBtn = (dice: string): Button => Markup.button(`${ dice }`)

const getDiceKeyBoard = () => Markup
    .keyboard([
        [
            getDiceBtn('d2'),
            getDiceBtn('d4'),
            getDiceBtn('d6'),
            getDiceBtn('d8')
        ],
        [
            getDiceBtn('d10'),
            getDiceBtn('d12')
        ],
        [
            getDiceBtn('пом'),
            getDiceBtn('d20'),
            getDiceBtn('пре')
        ]
    ])

const scene = new BaseScene<IBot.TContext>('diceRoll');
const diceRoll = new DiceRollerMiddleware();

scene.enter(async ctx => {
    await ctx.reply('Ты вошел в режим броска кубиков.\n\nВыбирай кубик на клавиатуре или отправь мне формулу', {
        reply_markup: getDiceKeyBoard().selective(true),
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
                reply_to_message_id: ctx.message?.message_id,
            });

            await ctx.scene.reenter();

            return;
        }

        await ctx.replyWithHTML(msg, {
            reply_markup: Markup.inlineKeyboard([ EXIT_BUTTON ]),
            disable_notification: true,
            reply_to_message_id: ctx.message?.message_id,
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
            reply_to_message_id: ctx.message?.message_id,
        });
    }
});

scene.action(ACTIONS.ExitFromRoller, async ctx => {
    await ctx.answerCbQuery();

    await ctx.reply('Ты закончил бросать кубики', {
        reply_markup: {
            remove_keyboard: true,
            selective: true
        },
        disable_notification: true,
        reply_to_message_id: ctx.message?.message_id,
    });

    await ctx.scene.leave();
})

export default scene
