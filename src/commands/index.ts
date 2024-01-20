import { createConversation } from '@grammyjs/conversations';
import { orderBy } from 'lodash-es';

import base from './base/index.js';
import tools from './tools/index.js';
import wiki from './wiki/index.js';

import type { IContext } from '../types/telegram.js';
import type { Bot } from 'grammy';

const COMMAND_LIST = orderBy(
  [...tools, ...wiki, ...base],
  ['order', 'command']
);

export const useCommands = () => {
  const commands = Object.values(COMMAND_LIST).filter(cmd => !cmd.hidden);

  const setMyCommands = async (bot: Bot<IContext>, attempt = 0) => {
    if (attempt >= 4) {
      console.error(new Error('Failed to install command menu!'));

      return;
    }

    try {
      await bot.api.setMyCommands(
        commands.map(({ command, description }) => ({ command, description }))
      );
    } catch (err) {
      console.error(err);

      setTimeout(() => setMyCommands(bot, attempt + 1), 10000);
    }
  };

  const registerCommands = (bot: Bot<IContext>) => {
    for (const command of COMMAND_LIST) {
      if (command.conversation) {
        bot.errorBoundary(
          err => console.error('Conversation threw an error!', err),
          createConversation(command.conversation, command.command)
        );
      }

      bot.command(command.command, async (ctx, next) => {
        await ctx.conversation.exit();
        await command.callback(ctx, next);
      });
    }
  };

  return {
    commands,
    setMyCommands,
    registerCommands
  };
};
