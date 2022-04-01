import { Composer } from 'telegraf';
import { COMMAND_NAME } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';

const bot = new Composer<IBot.TContext>();

bot.command(COMMAND_NAME.DICE, async ctx => {
    await ctx.scene.leave();
    await ctx.scene.enter('diceRoll');
});

export default bot;
