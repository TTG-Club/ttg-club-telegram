import _ from 'lodash';
import {
    Composer,
    Markup
} from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import {
    COMMAND_NAME, COMMANDS_LIST
} from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';
import { ABOUT_MESSAGE, SOCIAL_LINKS } from '../../locales/about';

const bot = new Composer<IBot.TContext>();

const helpResponse = async (ctx: TelegrafContext) => {
    try {
        const defaultCommands = _.cloneDeep(COMMANDS_LIST);
        const modifiedList = Object.values(defaultCommands).map(item => (
            `${ COMMANDS_LIST[item.command].fullDescription }`
        ));

        let msg = 'Обычные команды нужно отправлять в личные сообщения с ботом или в чат, где добавлен этот бот, '
            + `например: /${ COMMAND_NAME.HELP }&#10;`
            + '&#10;<b>Список доступных команд:</b>&#10;';

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
        const msg = 'Искать заклинания можно в чатах и личных сообщениях с другими пользователями Telegram, '
            + 'где бот не добавлен. Чтобы начать поиск, введи название бота и название заклинания.&#10;'
            + `&#10;<b>Формат:</b> @${ ctx.botInfo?.username } [<i>название заклинания</i>]&#10;`
            + `&#10;<b>Пример:</b> <i>@${ ctx.botInfo?.username } врата</i>&#10;`;

        await ctx.replyWithHTML(msg, {
            reply_to_message_id: ctx.message?.message_id,
            disable_notification: true
        });
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
                    Markup.callbackButton('Список команд', COMMAND_NAME.HELP)
                ]]
            )
        })
    } catch (err) {
        console.error(err)
    }
});

bot.command(COMMAND_NAME.ABOUT, async ctx => {
    const getLinksKeyboard = () => Markup.inlineKeyboard(
        Object.values(SOCIAL_LINKS).map(link => ([
            Markup.urlButton(link.label, link.url)
        ]))
    )

    await ctx.reply(
        ABOUT_MESSAGE,
        {
            reply_to_message_id: ctx.message?.message_id,
            disable_notification: true,
            reply_markup: getLinksKeyboard()
        }
    )
});

bot.action(COMMAND_NAME.HELP, async ctx => {
    await inlineResponse(ctx);
    await helpResponse(ctx);
});

bot.help(async ctx => {
    await inlineResponse(ctx);
    await helpResponse(ctx);
});

bot.action(/.*/, async ctx => {
    await ctx.answerCbQuery();
});

export default bot;
