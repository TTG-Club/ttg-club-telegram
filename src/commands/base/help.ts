import { useCommands } from '../index.js';

import type { ICommand } from '../../types/commands.js';
import type { IContext } from '../../types/telegram.js';

const COMMAND_NAME = 'help';

const helpResponse = async (ctx: IContext) => {
  try {
    const { commands } = useCommands();

    const modifiedList = commands.map(item => `${item.fullDescription}`);

    let msg =
      'Обычные команды нужно отправлять в личные сообщения с ботом или в чат, где добавлен этот бот, ' +
      `например: /${COMMAND_NAME}&#10;` +
      '&#10;<b>Список доступных команд:</b>&#10;';

    modifiedList.forEach((cmd: string) => {
      msg += `\n${cmd}`;
    });

    await ctx.reply(msg, {
      disable_notification: true
    });
  } catch (err) {
    console.error(err);
  }
};

const inlineResponse = async (ctx: IContext) => {
  try {
    const msg =
      'Искать заклинания можно в чатах и личных сообщениях с другими пользователями Telegram, ' +
      'где бот не добавлен. Чтобы начать поиск, введи название бота и название заклинания.&#10;' +
      `&#10;<b>Формат:</b> @${ctx.me.username} [<i>название заклинания</i>]&#10;` +
      `&#10;<b>Пример:</b> <i>@${ctx.me.username} врата</i>&#10;`;

    await ctx.reply(msg, {
      disable_notification: true
    });
  } catch (err) {
    console.error(err);
  }
};

const helpCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'Помощь',
  fullDescription: `/${COMMAND_NAME} - Описание команд.`,
  callback: async ctx => {
    await inlineResponse(ctx);
    await helpResponse(ctx);
  }
};

export default helpCommand;
