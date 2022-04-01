import IBot from '../../../typings/TelegramBot';

export default class TelegrafHelpers {
    static getUserMentionHTMLString(ctx: IBot.TContext): string {
        const fullName = ctx.from?.last_name
            ? `${ ctx.from.first_name } ${ ctx.from.last_name }`
            : ctx.from?.first_name;
        const userName = ctx.from?.username || fullName;

        switch (ctx.chat?.type) {
            case 'group':
            case 'supergroup':
                return `<a href="tg://user?id=${ ctx.from?.id }">${ userName }</a>`;

            default:
                return 'Ты'
        }
    }
}
