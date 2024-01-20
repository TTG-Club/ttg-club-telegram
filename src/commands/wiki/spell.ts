import { InlineKeyboard, Keyboard } from 'grammy';
import { toNumber } from 'lodash-es';

import { useHelpers } from '../../utils/useHelpers.js';
import { useSpells } from '../../utils/useSpells.js';

import type { ICommand } from '../../types/commands.js';
import type { TSpellLink } from '../../types/spell.js';
import type { IContext } from '../../types/telegram.js';
import type { Conversation } from '@grammyjs/conversations';
import type { Other } from '@grammyjs/hydrate';

const COMMAND_NAME = 'spell';
const CANCEL_MSG = 'Закончить поиск';
const CANCEL_CB = 'cancel';

const { getSpellResponse, loadSpells, loadSpell } = useSpells();
const { getUserMentionHtmlString, leaveScene, getUrl } = useHelpers();

const getInlineKeyboard = (url?: string) =>
  url
    ? new InlineKeyboard()
        .url('Оригинал на TTG Club', getUrl(url))
        .row()
        .text(CANCEL_MSG, CANCEL_CB)
    : new InlineKeyboard().text(CANCEL_MSG, CANCEL_CB);

class SpellConversation {
  private spells: Array<TSpellLink> = [];

  private prevSearch = '';

  init = async (
    conversation: Conversation<IContext>,
    context: IContext
  ): Promise<boolean> => {
    try {
      if (!context.from) {
        return false;
      }

      if (!this.spells.length) {
        await context.reply('Введи название заклинания (минимум 3 буквы)', {
          reply_markup: {
            remove_keyboard: true,
            selective: true
          }
        });
      }

      const ctx = await conversation.waitFrom(context.from);

      const { message, callbackQuery } = ctx;

      if (callbackQuery?.data === CANCEL_CB) {
        return false;
      }

      if (!message?.text) {
        await conversation.skip();

        return this.init(conversation, context);
      }

      const msg = message.text.trim();

      if (msg === CANCEL_MSG) {
        return false;
      }

      const index = toNumber(msg);

      if (Number.isFinite(index)) {
        return this.select(conversation, ctx, index);
      }

      if (msg.length < 3) {
        await ctx.reply('Необходимо ввести минимум 3 буквы', {
          disable_notification: true,
          reply_markup: getInlineKeyboard()
        });

        return this.init(conversation, context);
      }

      return this.search(conversation, ctx, msg);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  private search = async (
    conversation: Conversation<IContext>,
    ctx: IContext,
    search: string
  ) => {
    try {
      if (this.prevSearch === search) {
        await ctx.reply('Ты уже задал этот вопрос', {
          disable_notification: true
        });

        return this.init(conversation, ctx);
      }

      this.prevSearch = search;

      const spells = await conversation.external(() => loadSpells(search));

      if (!spells.length) {
        await ctx.reply('Я не смог найти такое заклинание', {
          disable_notification: true,
          reply_markup: getInlineKeyboard()
        });

        return this.init(conversation, ctx);
      }

      if (spells.length > 10) {
        await ctx.reply('Я нашел слишком много заклинаний', {
          disable_notification: true,
          reply_markup: getInlineKeyboard()
        });

        return this.init(conversation, ctx);
      }

      this.spells = spells;

      if (spells.length === 1) {
        return this.select(conversation, ctx, 1);
      }

      const keyboard = new Keyboard([
        this.spells.map((_spell, index) => (index + 1).toString()),
        [CANCEL_MSG]
      ]);

      await ctx.reply(
        `Я нашел несколько заклинаний, выбери подходящее из этого списка:${this.spells.map(
          (spell, index) =>
            `${!index ? '\n' : ''}\n${index + 1}. ${spell.name.rus} [${
              spell.name.eng
            }]`
        )}`,
        {
          disable_notification: true,
          reply_markup: keyboard.resized().selected()
        }
      );

      return this.init(conversation, ctx);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  private select = async (
    conversation: Conversation<IContext>,
    ctx: IContext,
    index: number
  ): Promise<boolean> => {
    try {
      const spell = await loadSpell(this.spells[index - 1]!);

      if (!spell) {
        await ctx.reply('Произошла ошибка, попробуй еще раз...', {
          disable_notification: true
        });

        return this.init(conversation, ctx);
      }

      const messages = await getSpellResponse(spell);

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]!;

        const config: Other<'sendMessage', 'chat_id' | 'text'> = {
          disable_notification: true,
          disable_web_page_preview: true
        };

        if (i > 0) {
          config.reply_to_message_id = undefined;
        }

        if (i + 1 === messages.length) {
          config.reply_markup = getInlineKeyboard(spell.url);
        }

        await ctx.reply(msg, config);
      }

      return this.init(conversation, ctx);
    } catch (err) {
      return Promise.reject(err);
    }
  };
}

const spellCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'Поиск заклинания',
  fullDescription: `/${COMMAND_NAME} - Режим поиска заклинаний.`,
  order: 2,
  callback: ctx => ctx.conversation.enter(COMMAND_NAME),
  conversation: async (conversation, ctx) => {
    if (!ctx.from) {
      return;
    }

    await ctx.reply(
      `${getUserMentionHtmlString(ctx)} вошел(ла) в режим поиска заклинаний.`,
      {
        disable_notification: true,
        reply_markup: getInlineKeyboard()
      }
    );

    const scene = new SpellConversation();

    await scene.init(conversation, ctx);
    await leaveScene(ctx);
  }
};

export default spellCommand;
