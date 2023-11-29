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
  const commands = Object.values(COMMAND_LIST).filter(cmd => cmd.visible);

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
    registerCommands
  };
};
