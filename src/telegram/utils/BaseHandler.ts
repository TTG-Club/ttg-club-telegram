import IBot from '../../../typings/TelegramBot';
import TelegrafHelpers from './TelegrafHelpers';

export default class BaseHandler {
    static leaveScene = async (ctx: IBot.TContext, msg = 'вышел из текущего режима') => {
        const leaveStr = `${ TelegrafHelpers.getUserMentionHTMLString(ctx) } ${ msg.trim() }`;

        const reply = await ctx.reply(leaveStr, {
            reply_to_message_id: ctx.message?.message_id,
            disable_notification: true,
            reply_markup: {
                remove_keyboard: true,
                selective: true,
            },
            parse_mode: 'HTML',
        });

        await ctx.scene.leave();

        setTimeout(async () => {
            await ctx.tg.deleteMessage(reply.chat.id, reply.message_id);
        }, 500)
    }
}
