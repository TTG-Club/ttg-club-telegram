import type { IContext } from '../types/telegram.js';

export const useHelpers = () => {
  const getUserMentionHtmlString = (ctx: IContext): string => {
    const fullName = ctx.from?.last_name
      ? `${ctx.from.first_name} ${ctx.from.last_name}`
      : ctx.from?.first_name;

    const userName = ctx.from?.username || fullName;

    switch (ctx.chat?.type) {
      case 'group':
      case 'supergroup':
        return `<a href="tg://user?id=${ctx.from?.id}">${userName}</a>`;

      default:
        return 'Ты';
    }
  };

  const pluralize = (number: number, strings: string[]) => {
    const num = Math.abs(number);

    if (Number.isInteger(num)) {
      const cases = [2, 0, 1, 1, 1, 2];

      const idx =
        number % 100 > 4 && number % 100 < 20
          ? 2
          : cases[number % 10 < 5 ? number % 10 : 5];

      return strings[idx as number];
    }

    return strings[1];
  };

  const leaveScene = async (ctx: IContext) => {
    await ctx.conversation?.exit();

    const leaveStr = `${getUserMentionHtmlString(
      ctx
    )} вышел из текущего режима`;

    const reply = await ctx.reply(leaveStr, {
      disable_notification: true,
      reply_markup: {
        remove_keyboard: true,
        selective: true
      }
    });

    setTimeout(reply.delete, 1000);
  };

  return {
    getUserMentionHtmlString,
    leaveScene,
    pluralize
  };
};
