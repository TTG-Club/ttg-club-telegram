import { DiceRoll } from 'rpg-dice-roller';
import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardMarkup, InlineKeyboardButton } from 'telegraf/src/core/types/typegram';
import IBot from '../../types/bot';

export default class DiceScenes {
    static ACTIONS = {
        exitFromRoller: 'EXIT_FROM_ROLLER',
        rollDice: 'ROLL_DICE'
    }

    static EXIT_BUTTON = [Markup.button.callback('Закончить броски', DiceScenes.ACTIONS.exitFromRoller)];

    static diceRoll(): Scenes.BaseScene<IBot.IContext> {
        const scene = new Scenes.BaseScene<IBot.IContext>('diceRoll');

        scene.enter(async ctx => {
            await ctx.replyWithHTML(
                'Ты вошел в режим броска кубиков.\nВыбери кубик из списка:',
                DiceScenes.diceKeyboard()
            )
        });

        scene.action(new RegExp('.*'), async (ctx, next) => {
            await ctx.answerCbQuery();

            await next();
        });

        scene.action(new RegExp(`^${DiceScenes.ACTIONS.rollDice} (\\d+)`), async ctx => {
            const dice = ctx.match[1];
            const result = new DiceRoll(`d${dice}`);

            await ctx.editMessageReplyMarkup(undefined);
            await ctx.replyWithHTML(
                `На кубике выпало: <b>${String(result.total)}</b>`,
                DiceScenes.diceKeyboard()
            );
        })

        scene.action(DiceScenes.ACTIONS.exitFromRoller, async ctx => {
            await ctx.editMessageReplyMarkup(undefined);
            await ctx.reply('Ты вышел из режима броска кубиков');

            await ctx.scene.leave();
        });

        return scene
    }

    static diceButton(number: string): InlineKeyboardButton.CallbackButton {
        return Markup.button.callback(number, `${DiceScenes.ACTIONS.rollDice} ${number}`);
    }

    static diceKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup
            .inlineKeyboard([
                [
                    DiceScenes.diceButton('2'),
                    DiceScenes.diceButton('4'),
                    DiceScenes.diceButton('6'),
                    DiceScenes.diceButton('8')
                ],
                [
                    DiceScenes.diceButton('10'),
                    DiceScenes.diceButton('12')
                ],
                [
                    DiceScenes.diceButton('20')
                ],
                DiceScenes.EXIT_BUTTON
            ]);
    }
}
