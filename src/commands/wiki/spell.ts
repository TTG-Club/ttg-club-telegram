import { InlineKeyboard, Keyboard } from 'grammy';
import { toNumber } from 'lodash-es';

import cancelCallback from '../../callbacks/cancel.js';
import { useAxios } from '../../utils/useAxios.js';
import { useConfig } from '../../utils/useConfig.js';
import { useHelpers } from '../../utils/useHelpers.js';
import { useMarkup } from '../../utils/useMarkup.js';

import type { ICommand } from '../../types/commands.js';
import type {
  TSpellItem,
  TSpellItemComponents,
  TSpellLink
} from '../../types/spell.js';
import type { IContext } from '../../types/telegram.js';
import type { Conversation } from '@grammyjs/conversations';
import type { Other } from '@grammyjs/hydrate';

const COMMAND_NAME = 'spell';
const CANCEL_MSG = 'Закончить поиск';

const { MAX_LENGTH } = useConfig();
const { getUserMentionHtmlString, leaveScene, getUrl } = useHelpers();
const { getDescriptionEmbeds } = useMarkup();

class SpellConversation {
  private readonly http = useAxios();

  private spells: Array<TSpellLink> = [];

  private prevSearch = '';

  init = async (
    conversation: Conversation<IContext>,
    context?: IContext
  ): Promise<boolean> => {
    try {
      context?.reply('Введи название заклинания (минимум 3 буквы)', {
        reply_to_message_id: undefined,
        reply_markup: { remove_keyboard: true }
      });

      const ctx = await conversation.waitFor('message:text');

      const {
        msg: { text }
      } = ctx;

      const msg = text.trim();

      if (text === CANCEL_MSG) {
        return false;
      }

      const index = toNumber(msg);

      if (Number.isFinite(index)) {
        return this.select(conversation, ctx, index);
      }

      if (msg.length < 3) {
        await ctx.reply('Необходимо ввести минимум 3 буквы', {
          disable_notification: true,
          reply_markup: new InlineKeyboard().text(
            'Закончить поиск заклинаний',
            cancelCallback.data
          )
        });

        return this.init(conversation);
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
          disable_notification: true,
          reply_markup: new InlineKeyboard().text(
            'Закончить поиск заклинаний',
            cancelCallback.data
          )
        });

        return this.init(conversation);
      }

      this.prevSearch = search;

      const spells = await conversation.external(() => this.loadSpells(search));

      if (!spells.length) {
        await ctx.reply('Я не смог найти такое заклинание', {
          disable_notification: true,
          reply_markup: new InlineKeyboard().text(
            'Закончить поиск заклинаний',
            cancelCallback.data
          )
        });

        return this.init(conversation);
      }

      if (spells.length > 10) {
        await ctx.reply('Я нашел слишком много заклинаний', {
          disable_notification: true,
          reply_markup: new InlineKeyboard().text(
            'Закончить поиск заклинаний',
            cancelCallback.data
          )
        });

        return this.init(conversation);
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

      return this.init(conversation);
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
      const spell = await this.loadSpell(this.spells[index - 1]!);

      if (!spell) {
        await ctx.reply('Произошла ошибка, попробуй еще раз...', {
          disable_notification: true
        });

        return this.init(conversation);
      }

      const messages = await this.getSpellResponse(spell);

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
          config.reply_markup = new InlineKeyboard()
            .url('Оригинал на TTG Club', getUrl(spell.url))
            .row()
            .text('Закончить поиск заклинаний', cancelCallback.data);
        }

        await ctx.reply(msg, config);
      }

      return this.init(conversation);
    } catch (err) {
      return Promise.reject(err);
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

  private loadSpell = async (spellLink: TSpellLink): Promise<TSpellItem> => {
    try {
      const { data: spell } = await this.http.post<TSpellItem>({
        url: spellLink.url
      });

      return spell;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  private getSpellResponse = (spell: TSpellItem): Promise<Array<string>> => {
    try {
      const messages: string[] = [
        `<b>${spell.name.rus}</b> [<i>${spell.name.eng}</i>]`
      ];

      const updateMsg = (str: string) => {
        const index = messages.length > 0 ? messages.length - 1 : 0;

        if (messages[index]!.length + str.length > MAX_LENGTH) {
          messages[index + 1] = str;

          return;
        }

        messages[index] += str;
      };

      updateMsg(`\n<i>${this.getSubTitle(spell)}</i>\n`);

      updateMsg(
        `\n<b>Источник:</b> ${spell.source.name} [${spell.source.shortName}]`
      );

      updateMsg(`\n<b>Время накладывания:</b> ${spell.time}`);
      updateMsg(`\n<b>Дистанция:</b> ${spell.range}`);
      updateMsg(`\n<b>Длительность:</b> ${spell.duration}`);

      updateMsg(
        `\n<b>Компоненты:</b> ${this.getComponents(spell.components)}\n`
      );

      const classes = spell.classes
        .map(
          classItem =>
            `<a href="${getUrl(classItem.url)}">${classItem.name}</a>`
        )
        .join(', ');

      if (classes.length) {
        updateMsg(`\n<b>Классы:</b> ${classes}`);
      }

      const subClasses = spell.subclasses
        ?.map(
          subclass =>
            `<a href="${getUrl(subclass.url)}">${subclass.name} (${
              subclass.class
            })</a>`
        )
        .join(', ');

      if (subClasses?.length) {
        updateMsg(`\n<b>Подклассы:</b> ${subClasses}`);
      }

      const races = spell.races
        ?.map(race => `<a href="${getUrl(race.url)}">${race.name}</a>`)
        .join(', ');

      if (races?.length) {
        updateMsg(`\n<b>Расы и происхождения:</b> ${races}`);
      }

      const backgrounds = spell.backgrounds
        ?.map(
          background =>
            `<a href="${getUrl(background.url)}">${background.name}</a>`
        )
        .join(', ');

      if (backgrounds?.length) {
        updateMsg(`\n<b>Предыстории:</b> ${backgrounds}`);
      }

      if (spell.description) {
        updateMsg(`\n\n`);

        for (const row of getDescriptionEmbeds(spell.description)) {
          updateMsg(row);
        }
      }

      if (spell.upper) {
        updateMsg(`\n\n<b>На более высоких уровнях: </b>`);

        for (const row of getDescriptionEmbeds(`<p>${spell.upper}</p>`)) {
          updateMsg(row);
        }
      }

      return Promise.resolve(messages);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  private getSubTitle = (spell: TSpellItem) =>
    `${spell.level ? `${spell.level} уровень` : 'заговор'}, ${spell.school}${
      spell.additionalType ? ` [${spell.additionalType}]` : ''
    }${spell.ritual ? ' (ритуал)' : ''}`;

  private getComponents = (components: TSpellItemComponents) =>
    `${
      components.v
        ? `Вербальный${components.s || components.m ? ', ' : ''}`
        : ''
    }${components.s ? `Соматический${components.m ? ', ' : ''}` : ''}${
      components.m ? `Материальный (${components.m})` : ''
    }`;
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

    await ctx.reply(`${userName} вошел(ла) в режим поиска заклинаний.`, {
      disable_notification: true,
      reply_markup: new InlineKeyboard().text(
        'Закончить поиск заклинаний',
        cancelCallback.data
      )
    });

    const scene = new SpellConversation();

    await scene.init(conversation, ctx);
    await leaveScene(ctx);
  }
};

export default spellCommand;
