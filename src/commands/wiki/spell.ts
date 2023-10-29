import { InlineKeyboard } from 'grammy';

import cancelCallback from '../../callbacks/cancel.js';
import { useAxios } from '../../utils/useAxios.js';
import { useHelpers } from '../../utils/useHelpers.js';

import type { ICommand } from '../../types/commands.js';
import type { TSpellLink } from '../../types/spell.js';
import type { IContext } from '../../types/telegram.js';
import type { Conversation } from '@grammyjs/conversations';

const COMMAND_NAME = 'spell';

const { getUserMentionHtmlString, leaveScene } = useHelpers();
const http = useAxios();

const getSpells = async (search: string): Promise<Array<TSpellLink>> => {
  try {
    const { data: spells } = await http.post<Array<TSpellLink>>({
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
    return Promise.reject();
  }
};

const searchHandler = async (
  conversation: Conversation<IContext>,
  context: IContext,
  search: string
) => {
  const spells = await conversation.external(() => getSpells(search));

  console.log(spells);

  const name = await conversation.form.select(
    spells.map(item => `${item.name.rus} [${item.name.eng}]`),
    async ctx => {
      const newSearch = ctx.msg?.text?.trim();

      if (!newSearch) {
        await ctx.reply('Необходимо выбрать из списка или другое название');
      }

      await searchHandler(conversation, context, search);
    }
  );

  const match = name.match(/^(.+?)(\[(?<engName>.+?)])$/i);
  const matchedName = match?.groups?.engName?.trim();

  if (!matchedName) {
    await context.reply('Произошла ошибка, попробуй еще раз...');

    return;
  }

  const spell = spells.find(item => item.name.eng === matchedName);

  if (!spell) {
    await context.reply('Произошла ошибка, попробуй еще раз...');
  }
};

const handler = async (conversation: Conversation<IContext>, prev: string) => {
  const ctx = await conversation.waitFor('message:text');

  const {
    msg: { text }
  } = ctx;

  const search = text.trim();

  if (!search) {
    await ctx.reply('Введи название заклинания (минимум 3 буквы)');

    await handler(conversation, search);

    return;
  }

  if (prev === search) {
    await ctx.reply('Ты уже задал этот вопрос');

    await handler(conversation, search);

    return;
  }

  await searchHandler(conversation, ctx, search);
};

const spellCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'Поиск заклинания',
  fullDescription: `/${COMMAND_NAME} - Режим поиска заклинаний.`,
  order: 2,
  callback: ctx => ctx.conversation.enter(COMMAND_NAME),
  conversation: async (conversation: Conversation<IContext>, ctx: IContext) => {
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

    await handler(conversation, '');
    await leaveScene(ctx);
  }
};

export default spellCommand;
