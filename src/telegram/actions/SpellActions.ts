import { Composer } from 'telegraf';
import { COMMAND_NAME } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';

const bot = new Composer<IBot.TContext>();

bot.command(COMMAND_NAME.SPELL, async ctx => {
    await ctx.scene.leave();
    await ctx.scene.enter('findSpell');
});

export default bot;
