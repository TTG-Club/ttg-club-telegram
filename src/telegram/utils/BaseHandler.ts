import IBot from '../../../typings/TelegramBot';

export default class BaseHandler {
    static leaveScene = async (ctx: IBot.TContext, msg = 'вышел из текущего режима') => {
        const fullName = ctx.from?.last_name
            ? `${ ctx.from.first_name } ${ ctx.from.last_name }`
            : ctx.from?.first_name;
        const userName = fullName || ctx.from?.username;

        let leaveStr;

        switch (ctx.chat?.type) {
            case 'group':
            case 'supergroup':
                leaveStr = `[${ userName }](tg://user?id=${ ctx.from?.id }) ${ msg.trim() }`;

                break;
            default:
                leaveStr = `Ты ${ msg.trim() }`

                break;
        }

        await ctx.reply(leaveStr, {
            reply_markup: {
                remove_keyboard: true,
                selective: true,
            },
            parse_mode: 'MarkdownV2',
            disable_notification: true,
            reply_to_message_id: ctx.message?.message_id
        });

        await ctx.scene.leave();
    }
}
