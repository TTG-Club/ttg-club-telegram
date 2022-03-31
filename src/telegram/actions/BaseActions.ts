import _ from 'lodash';
import {
    Composer,
    Markup
} from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import { COMMAND_NAME, COMMANDS_LIST } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';

const bot = new Composer<IBot.TContext>();
const helpResponse = async (ctx: TelegrafContext) => {
    try {
        const defaultCommands = _.cloneDeep(COMMANDS_LIST);
        const modifiedList = Object.values(defaultCommands).map(item => (
            `${ COMMANDS_LIST[item.command].fullDescription }`
        ))

        let msg = '<b>Список доступных команд:</b>\n';

        modifiedList.forEach((cmd: string) => {
            msg += `\n${cmd}`;
        });

        await ctx.replyWithHTML(msg);
    } catch (err) {
        console.error(err);
    }
}

bot.start(async ctx => {
    try {
        await ctx.reply('Приветствую, искатель приключений! 👋🏻', {
            reply_markup: Markup.inlineKeyboard(
                [[
                    Markup.callbackButton('Список команд', 'baseHelp')
                ]]
            )
        })
    } catch (err) {
        console.error(err)
    }
});

bot.action('baseHelp', async ctx => {
    await ctx.answerCbQuery();

    await helpResponse(ctx)
});

bot.help(async ctx => {
    await helpResponse(ctx)
});

bot.command(COMMAND_NAME.ABOUT, async ctx => {
    await ctx.reply('Этот бот служит дополнением для онлайн-справочника DnD5 Club, '
        + 'доступного по этой ссылке: https://dnd5.club/'
        + '\n\nПрисоединяйся к нашему Discord-каналу по кнопке ниже ☺️', {
        reply_markup: {
            ...Markup.inlineKeyboard([[
                Markup.urlButton('Сайт DnD5 Club', 'https://dnd5.club/')
            ], [
                Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z')
            ]])
        }
    })
});

export default bot;
