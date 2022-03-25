import { Composer } from 'telegraf';
import { COMMAND_NAME } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';
import TContext = IBot.TContext;

export default class DiceActions {
    private bot = new Composer<TContext>();

    public registerCommands() {
        this.bot.command(COMMAND_NAME.DICE, async ctx => {
            await ctx.scene.leave();
            await ctx.scene.enter('diceRoll');
        });

        return this.bot;
    }
}
