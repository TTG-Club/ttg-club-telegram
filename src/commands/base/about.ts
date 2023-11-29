import { InlineKeyboard } from 'grammy';

import { ABOUT_MESSAGE, SOCIAL_LINKS } from '../../locales/about.js';

import type { ICommand } from '../../types/commands.js';

const COMMAND_NAME = 'about';

const aboutCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'О боте',
  fullDescription: `/${COMMAND_NAME} - Небольшая информация о боте.`,
  callback: async ctx => {
    const inlineKeyboard = new InlineKeyboard();

    for (const btn of Object.values(SOCIAL_LINKS)) {
      inlineKeyboard.url(btn.label, btn.url);
    }

    await ctx.reply(ABOUT_MESSAGE, {
      disable_notification: true,
      reply_markup: inlineKeyboard
    });
  }
};

export default aboutCommand;
