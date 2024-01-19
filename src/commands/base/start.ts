import type { ICommand } from '../../types/commands.js';

const startCommand: ICommand = {
  command: 'start',
  description: 'Приветствие',
  hidden: true,
  callback: async ctx => {
    try {
      await ctx.reply(
        'Приветствую, искатель приключений! 👋🏻\nВведи /help, если нужна помощь с командами'
      );
    } catch (err) {
      console.error(err);
    }
  }
};

export default startCommand;
