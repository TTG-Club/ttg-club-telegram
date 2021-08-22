import { Telegraf } from 'telegraf';
import Commands from '../constants/Commands';
import BotClass from '../BotClass';
import IBot from '../../types/bot';

export default class DiceActions {
    private readonly bot: Telegraf<IBot.IContext>;

    constructor() {
        this.bot = BotClass.bot;

        this.registerCommands();
    }

    private registerCommands() {
        try {
            this.bot.command(Commands.DICE, async ctx => {
                await ctx.scene.leave();
                await ctx.scene.enter('diceRoll');
            })
        } catch (err) {
            throw new Error(err)
        }
    }
}
