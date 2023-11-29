import type { IContext } from './telegram.js';
import type { ConversationFn } from '@grammyjs/conversations/out/conversation.js';
import type { MiddlewareFn } from 'grammy';
import type { BotCommand } from 'grammy/types';

export interface ICommand extends BotCommand {
  order?: number;
  visible?: boolean;
  callback: MiddlewareFn<IContext>;
  conversation?: ConversationFn<IContext>;
  fullDescription?: string;
}

interface ICommandList {
  [key: ICommand['command']]: ICommand;
}
