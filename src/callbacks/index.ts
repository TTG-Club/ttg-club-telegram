import type { ICallback } from '../types/callbacks.js';
import type { IContext } from '../types/telegram.js';
import type { Bot } from 'grammy';

const CALLBACK_LIST: Array<ICallback> = [];

export const useCallbacks = () => {
  const registerCallbacks = (bot: Bot<IContext>) => {
    bot.on('callback_query:data', async (ctx, next) => {
      await ctx.answerCallbackQuery();
      await next();
    });

    for (const callback of CALLBACK_LIST) {
      bot.callbackQuery(callback.data, callback.callback);
    }
  };

  return {
    registerCallbacks
  };
};
