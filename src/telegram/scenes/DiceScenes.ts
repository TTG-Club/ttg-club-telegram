import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import { BaseScene, Markup } from 'telegraf';
import { SceneContextMessageUpdate } from 'telegraf/typings/stage';
import { Button, CallbackButton } from 'telegraf/typings/markup';

enum ACTIONS {
    ExitFromRoller = 'exitFromDice',
}

export default class DiceScenes {
    EXIT_BUTTON: CallbackButton[] = [ Markup.callbackButton('Закончить броски', ACTIONS.ExitFromRoller) ];

    public diceRoll() {
        const scene = new BaseScene('diceRoll');

        scene.enter(async (ctx: SceneContextMessageUpdate) => {
            await ctx.reply(
                'Ты вошел в режим броска кубиков.\n\nВыбирай кубик на клавиатуре или отправь мне формулу',
                this.diceKeyboard()
            );

            await ctx.reply('Держи ссылку на подсказку, чтобы знать как пишутся формулы ☺️', {
                reply_markup: {
                    ...Markup.inlineKeyboard([[
                        Markup.urlButton(
                            'Dice Roller',
                            'https://dice-roller.github.io/documentation/guide/notation/'
                        )
                    ], this.EXIT_BUTTON ])
                }
            })
        });

        scene.on('text', async (ctx: SceneContextMessageUpdate) => {
            if (!ctx.message || !('text' in ctx.message)) {
                await ctx.reply('Произошла какая-то ошибка...');

                await ctx.scene.reenter();

                return;
            }

            if (ctx.message.text === ACTIONS.ExitFromRoller) {
                await ctx.reply('Ты вышел из режима броска кубиков', {
                    reply_markup: { remove_keyboard: true }
                });
                await ctx.deleteMessage();
                await ctx.scene.leave();

                return;
            }

            const str = ctx.message.text;

            let notation;

            switch (str) {
                case 'пом':
                    notation = '2d20kl1';

                    break;

                case 'пре':
                    notation = '2d20kh1';

                    break;

                default:
                    notation = str;

                    break;
            }

            let result;

            try {
                result = new DiceRoll(notation);
            } catch (err) {
                await ctx.reply('В формуле броска кубиков ошибка.\n\nНе забывай про подсказку, если не получается', {
                    reply_markup: {
                        ...Markup.inlineKeyboard([[
                            Markup.urlButton(
                                'Dice Roller',
                                'https://dice-roller.github.io/documentation/guide/notation/'
                            )
                        ], this.EXIT_BUTTON ])
                    }
                });

                return;
            }

            // eslint-disable-next-line max-len
            await ctx.replyWithHTML(`Ты бросил <b>${ notation }</b>. Результат: <b>${ String(result.total) }</b>\n\n<b>Расшифровка:</b> ${ result.output }`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [ this.EXIT_BUTTON ]
                }
            });
            await ctx.deleteMessage();
        });

        scene.action(ACTIONS.ExitFromRoller, async ctx => {
            await ctx.answerCbQuery();

            await ctx.reply('Ты закончил бросать кубики', {
                reply_markup: { remove_keyboard: true }
            });

            await ctx.scene.leave();
        })

        return scene
    }

    private diceButton = (dice: string): Button => Markup.button(`${ dice }`)

    private diceKeyboard() {
        return Markup
            .keyboard([
                [
                    this.diceButton('d2'),
                    this.diceButton('d4'),
                    this.diceButton('d6'),
                    this.diceButton('d8')
                ],
                [
                    this.diceButton('d10'),
                    this.diceButton('d12')
                ],
                [
                    this.diceButton('пом'),
                    this.diceButton('d20'),
                    this.diceButton('пре')
                ]
            ]).extra();
    }
}
