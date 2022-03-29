import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import { BaseScene, Markup } from 'telegraf';
import { Button, CallbackButton } from 'telegraf/typings/markup';
import IBot from '../../../typings/TelegramBot';

enum ACTIONS {
    ExitFromRoller = 'exitFromDice',
}

export default class DiceScenes {
    EXIT_BUTTON: CallbackButton[] = [ Markup.callbackButton('Закончить броски', ACTIONS.ExitFromRoller) ];

    public diceRoll() {
        const scene = new BaseScene<IBot.TContext>('diceRoll');

        scene.enter(async ctx => {
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

        scene.on('text', async ctx => {
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

            switch (str) {
                case 'пом':
                case 'пре':
                    await this.dropOrKeep(ctx, str);

                    break;
                default:
                    await this.diceRoller(ctx, str);

                    break;
            }
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

    private dropOrKeep = async (ctx: IBot.ISceneSessionContext, str: string) => {
        try {
            const roll = new DiceRoll(str === 'пре' ? '2d20kh1' : '2d20kl1');
            const resultStr = roll.export();

            if (!resultStr) {
                return;
            }

            const result = JSON.parse(resultStr);
            const { rolls } = result.rolls[0];

            await ctx.replyWithHTML(
                `<b>Бросок:</b> 2d20 с ${ ctx.message.text === 'пом' ? 'помехой' : 'преимуществом' }`
                + `\n<b>Результат:</b> ${ String(roll.total) }`
                + `\n\n<b>Лучший результат:</b> ${
                    rolls.find((dice: any) => dice.useInTotal === (str === 'пре')).value }`
                + `\n<b>Худший результат:</b> ${
                    rolls.find((dice: any) => dice.useInTotal === (str !== 'пре')).value }`
                + `\n\n<b>Развернутый результат</b> ${ roll.output }`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [ this.EXIT_BUTTON ]
                    }
                }
            );
            await ctx.deleteMessage();

            return;
        } catch (err) {
            await ctx.reply('Произошла ошибка... попробуй еще раз или напиши нам в Discord-канал', {
                reply_markup: {
                    ...Markup.inlineKeyboard([
                        [ Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z') ]
                    ])
                }
            })
        }
    }

    private diceRoller = async (ctx: IBot.ISceneSessionContext, notation: string) => {
        try {
            const roll = new DiceRoll(notation);

            // eslint-disable-next-line max-len
            await ctx.replyWithHTML(
                `<b>Бросок:</b> ${ notation }`
                + `\n<b>Результат:</b> ${ String(roll.total) }`
                + `\n\n<b>Развернутый результат</b> ${ roll.output }`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [ this.EXIT_BUTTON ]
                    }
                }
            );
            await ctx.deleteMessage();
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
        }
    }
}
