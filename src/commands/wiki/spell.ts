import { InlineKeyboard, Keyboard } from 'grammy';
import { isNumber, toNumber } from 'lodash-es';

import cancelCallback from '../../callbacks/cancel.js';
import { useAxios } from '../../utils/useAxios.js';
import { useHelpers } from '../../utils/useHelpers.js';

import type { ICommand } from '../../types/commands.js';
import type { TSpellLink } from '../../types/spell.js';
import type { IContext } from '../../types/telegram.js';
import type { Conversation } from '@grammyjs/conversations';

const COMMAND_NAME = 'spell';

const { getUserMentionHtmlString, leaveScene } = useHelpers();

class SpellConversation {
  private readonly http = useAxios();

  private spells: Array<TSpellLink> = [];

  private prevSearch = '';

  init = async (conversation: Conversation<IContext>): Promise<boolean> => {
    const ctx = await conversation.waitFor('message:text');

    const {
      msg: { text }
    } = ctx;

    const search = text.trim();

    if (!search) {
      await ctx.reply('Введи название заклинания (минимум 3 буквы)', {
        disable_notification: true
      });

      return this.init(conversation);
    }

    if (this.prevSearch === search) {
      await ctx.reply('Ты уже задал этот вопрос', {
        disable_notification: true
      });

      return this.init(conversation);
    }

    this.prevSearch = search;
    this.spells = await conversation.external(() => this.loadSpells(search));

    if (!this.spells.length) {
      await ctx.reply('Я не смог найти такое заклинание', {
        disable_notification: true
      });

      return this.init(conversation);
    }

    const keyboard = new Keyboard([
      this.spells.map((_spell, index) => (index + 1).toString())
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

    return this.select(conversation);
  };

  private select = async (conversation: Conversation<IContext>) => {
    const ctx = await conversation.waitFor('message:text');

    const {
      msg: { text }
    } = ctx;

    const match = text.match(/^(?<index>\d+?)\.(.+?)(\[(.+?)])$/i);
    const index = toNumber(match?.groups?.index?.trim());

    if (!isNumber(index)) {
      await ctx.reply('Произошла ошибка, попробуй еще раз...', {
        disable_notification: true
      });

      return false;
    }

    const spell = this.spells[index - 1];

    if (!spell) {
      await ctx.reply('Произошла ошибка, попробуй еще раз...', {
        disable_notification: true
      });

      return this.select(conversation);
    }
  };

  private loadSpells = async (search: string): Promise<Array<TSpellLink>> => {
    try {
      const { data: spells } = await this.http.post<Array<TSpellLink>>({
        url: '/spells',
        payload: {
          page: 0,
          limit: 10,
          search: {
            value: search,
            exact: false
          },
          order: [
            {
              field: 'level',
              direction: 'asc'
            },
            {
              field: 'name',
              direction: 'asc'
            }
          ]
        }
      });

      return spells;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  // private loadSpell = async (url: string): Promise<TSpellItem> => {
  //   try {
  //     const { data: spell } = await this.http.post<TSpellItem>({
  //       url
  //     });
  //
  //     return spell;
  //   } catch (err) {
  //     return Promise.reject(err);
  //   }
  // };
  //
  // private getSpellResponse = (spell: TSpellItem) => {
  //   console.log(spell);
  //
  //   return spell.name.rus;
  // };
}

const spellCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'Поиск заклинания',
  fullDescription: `/${COMMAND_NAME} - Режим поиска заклинаний.`,
  order: 2,
  callback: ctx => ctx.conversation.enter(COMMAND_NAME),
  conversation: async (conversation, ctx) => {
    if (ctx.from === undefined) {
      await ctx.reply('Боги отвечают лишь тем, у кого есть душа', {
        disable_notification: true
      });

      return;
    }

    const userName = getUserMentionHtmlString(ctx);

    await ctx.reply(
      `${userName} вошел(ла) в режим поиска заклинаний.` +
        '\nВведи название заклинания (минимум 3 буквы)',
      {
        disable_notification: true,
        reply_markup: new InlineKeyboard().text(
          'Закончить поиск заклинаний',
          cancelCallback.data
        )
      }
    );

    const scene = new SpellConversation();

    await scene.init(conversation);
    await leaveScene(ctx);
  }
};

export default spellCommand;
