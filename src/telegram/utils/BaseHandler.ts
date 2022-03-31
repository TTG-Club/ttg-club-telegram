import IBot from '../../../typings/TelegramBot';
import TelegrafHelpers from './TelegrafHelpers';

export default class BaseHandler {
    static leaveScene = async (ctx: IBot.TContext, msg = 'вышел из текущего режима') => {
        const leaveStr = `${ TelegrafHelpers.getUserMentionHTMLString(ctx) } ${ msg.trim() }`;

        await ctx.reply(leaveStr, {
            reply_markup: {
                remove_keyboard: true,
                selective: true,
            },
            parse_mode: 'HTML',
            disable_notification: true,
        });

        await ctx.scene.leave();
    }
}
