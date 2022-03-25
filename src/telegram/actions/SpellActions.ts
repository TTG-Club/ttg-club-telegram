import { Composer } from 'telegraf';
import { COMMAND_NAME } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';
import TContext = IBot.TContext;

export default class SpellActions {
    private bot = new Composer<TContext>();

    constructor() {
        this.registerCommands();
    }

    public registerCommands() {
        this.bot.command(COMMAND_NAME.SPELL, async ctx => {
            await ctx.scene.leave();
            await ctx.scene.enter('findSpell');
        });

        return this.bot;
    }
}
