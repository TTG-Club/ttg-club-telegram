import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import { BaseScene, Markup } from 'telegraf';
import { SceneContextMessageUpdate } from 'telegraf/typings/stage';
import { Button } from 'telegraf/typings/markup';

enum ACTIONS {
    ExitFromRoller = 'Закончить броски',
}
export default class DiceScenes {
    EXIT_BUTTON: Button[] = [ Markup.button(ACTIONS.ExitFromRoller) ];

    public diceRoll() {
        const scene = new BaseScene('diceRoll');

        scene.enter(async (ctx: SceneContextMessageUpdate) => {
            await ctx.reply(
                'Ты вошел в режим броска кубиков.\nВыбирай кубик на клавиатуре и вперед!',
                this.diceKeyboard()
            );
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

            const availDice = [ 'd2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20' ];

            if (!availDice.includes(ctx.message.text)) {
                await ctx.reply('Такого кубика нет в списке 😌');
                await ctx.scene.reenter();

                return;
            }

            const dice = ctx.message.text;
            const result = new DiceRoll(dice);

            await ctx.replyWithHTML(`Ты бросил кубик <b>${dice}</b>. Результат: <b>${String(result.total)}</b>`, {
                parse_mode: 'HTML'
            });
            await ctx.deleteMessage();
        });

        return scene
    }

    private diceButton = (dice: string): Button => Markup.button(`${dice}`)

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
                    this.diceButton('d20')
                ],
                this.EXIT_BUTTON
            ]).extra();
    }
}
