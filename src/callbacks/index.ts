import cancelCallback from './cancel.js';

import type { IContext } from '../types/telegram.js';
import type { Bot } from 'grammy';

const CALLBACK_LIST = [cancelCallback];

export const useCallbacks = () => {
  const registerCallbacks = (bot: Bot<IContext>) => {
    for (const callback of CALLBACK_LIST) {
      bot.callbackQuery(callback.data, callback.callback);
    }
  };

  return {
    registerCallbacks
  };
};
