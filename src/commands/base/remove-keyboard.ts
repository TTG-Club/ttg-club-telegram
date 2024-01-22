import type { ICommand } from '../../types/commands.js';

const COMMAND_NAME = 'remove_keyboard';

const removeKeyboardCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'Удалить клавиатуру',
  fullDescription: `/${COMMAND_NAME} - удаление клавиатуры в чате`,
  callback: async ctx => {
    try {
      const reply = await ctx.reply('Сейчас все почистим...', {
        disable_notification: true,
        reply_markup: {
          input_field_placeholder: '',
          keyboard: []
        }
      });

      setTimeout(reply.delete, 1000);
    } catch (err) {
      console.error(err);
    }
  }
};

export default removeKeyboardCommand;
