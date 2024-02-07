import { InlineKeyboard, InlineQueryResultBuilder } from 'grammy';
import { debounce } from 'lodash-es';

import { useConfig } from '../utils/useConfig.js';
import { useHelpers } from '../utils/useHelpers.js';
import { useSpells } from '../utils/useSpells.js';

import type { IContext } from '../types/telegram.js';
import type { InlineQueryResultArticle } from '@grammyjs/types';
import type { Bot, InlineQueryContext } from 'grammy';

export const useInlineQueries = () => {
  const { getUrl } = useHelpers();
  const { MAX_LENGTH } = useConfig();
  const { loadSpells, loadSpell, getSpellResponse, getSubTitle } = useSpells();

  const answerConfig = {
    button: {
      text: 'Перейти в бота',
      start_parameter: 'start'
    }
  };

  const handler = debounce(async (ctx: InlineQueryContext<IContext>) => {
    const { query } = ctx.inlineQuery;

    if (!query || query.length < 3) {
      return ctx.answerInlineQuery([], answerConfig);
    }

    const links = await loadSpells(query, 50);
    const spells: Array<InlineQueryResultArticle> = [];

    const keyboard = new InlineKeyboard()
      .url('Оригинал на TTG Club', getUrl('/'))
      .row()
      .url('Перейти к боту', `https://t.me/${ctx.me?.username}`);

    for (const link of links) {
      const spell = await loadSpell(link);
      const response = await getSpellResponse(spell);

      const tooBigMsg =
        '...\n\n<b>Заклинание было обрезано из-за ограничений Telegram,' +
        ' пожалуйста, посмотрите оригинал на сайте по кнопке ниже или' +
        ' напишите боту в личные сообщения</b> 😉.';

      let msg = response.join();

      const isBig = msg.length > MAX_LENGTH;

      if (isBig) {
        msg = msg.slice(0, MAX_LENGTH - tooBigMsg.length).trim() + tooBigMsg;
      }

      spells.push(
        InlineQueryResultBuilder.article(
          spell.url,
          `${spell.name.rus} [${spell.name.eng}]`,
          {
            url: getUrl(spell.url),
            hide_url: false,
            description: `${getSubTitle(spell)}\n${spell.source.name} [${
              spell.source.shortName
            }]`,
            thumbnail_url: getUrl(`/img/no-img.webp`),
            reply_markup: keyboard
          }
        ).text(msg, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      );
    }

    return ctx.answerInlineQuery(spells, answerConfig);
  }, 500);

  const registerInlineQueries = (bot: Bot<IContext>) => {
    bot.on('inline_query', ctx => handler(ctx));
  };

  return {
    registerInlineQueries
  };
};
