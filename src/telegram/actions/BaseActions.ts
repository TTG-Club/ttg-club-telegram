import _ from 'lodash';
import {
    Composer,
    Markup
} from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import {
    COMMAND_NAME, COMMANDS_LIST, INLINE_COMMAND_LIST, INLINE_COMMAND_NAME
} from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';
import { ABOUT_MESSAGE, SOCIAL_LINKS } from '../../locales/about';

const bot = new Composer<IBot.TContext>();

const helpResponse = async (ctx: TelegrafContext) => {
    try {
        const defaultCommands = _.cloneDeep(COMMANDS_LIST);
        const modifiedList = Object.values(defaultCommands).map(item => (
            `${ COMMANDS_LIST[item.command].fullDescription }`
        ))

        let msg = '<b>Список доступных команд:</b>\n';

        modifiedList.forEach((cmd: string) => {
            msg += `\n${ cmd }`;
        });

        await ctx.replyWithHTML(msg, {
            reply_to_message_id: ctx.message?.message_id,
            disable_notification: true
        });
    } catch (err) {
        console.error(err);
    }
}

const inlineResponse = async (ctx: TelegrafContext) => {
    try {
        const commands = _.cloneDeep(INLINE_COMMAND_LIST);
        const modifiedList = Object.values(commands).map((item, index) => (
            `${ index + 1 }. ${ INLINE_COMMAND_LIST[item.command].fullDescription }`
        ))

        let msg = '<b>Список доступных команд:</b>\n';

        modifiedList.forEach((cmd: string) => {
            msg += `\n${ cmd }`;
        });

        await ctx.replyWithHTML(
            'Такие команды можно использовать в личных сообщениях Telegram с другими пользователями'
            + ` - просто вводите строку, например: <b>@dnd5club_bot ${ INLINE_COMMAND_NAME.SPELL } врата</b>`
            + `\n\n${ msg }`,
            {
                reply_to_message_id: ctx.message?.message_id,
                disable_notification: true
            }
        );
    } catch (err) {
        console.error(err);
    }
}

bot.start(async ctx => {
    try {
        await ctx.reply('Приветствую, искатель приключений! 👋🏻', {
            reply_to_message_id: ctx.message?.message_id,
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

bot.command(COMMAND_NAME.ABOUT, async ctx => {
    const getLinksKeyboard = () => Markup.inlineKeyboard(
        SOCIAL_LINKS.map(link => ([
            Markup.urlButton(link.label, link.url)
        ]))
    )

    await ctx.reply(
        ABOUT_MESSAGE,
        getLinksKeyboard()
            .extra({
                reply_to_message_id: ctx.message?.message_id
            })
            .notifications(false)
    )
});

bot.command(COMMAND_NAME.INLINE, async ctx => {
    await inlineResponse(ctx);
});

bot.action('baseHelp', async ctx => {
    await helpResponse(ctx);
});

bot.help(async ctx => {
    await helpResponse(ctx);
});

bot.action(/.*/, async ctx => {
    await ctx.answerCbQuery();
});

export default bot;
