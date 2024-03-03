import { autoRetry } from '@grammyjs/auto-retry';
import { conversations } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { hydrateReply, parseMode } from '@grammyjs/parse-mode';
import { autoQuote } from '@roziscoding/grammy-autoquote';
import { Bot, BotError, GrammyError, HttpError, session } from 'grammy';

import { useCallbacks } from './callbacks/index.js';
import { useCommands } from './commands/index.js';
import { useInlineQueries } from './inline-query/index.js';

import type { IContext } from './types/telegram.js';

if (!process.env.TOKEN || !process.env.TOKEN.length) {
  throw new Error('В .env не указана переменная TG_TOKEN');
}

if (!process.env.API_URL || !process.env.API_URL.length) {
  throw new Error('В .env не указана переменная BASE_URL');
}

const bot = new Bot<IContext>(process.env.TOKEN);

bot.use(
  session({
    initial: () => ({}),
    getSessionKey: (ctx): string | undefined =>
      !ctx.from || (!ctx.chat && !ctx.inlineQuery)
        ? undefined
        : `${ctx.from.id}/${ctx.chat?.id || ctx.inlineQuery?.from}`
  })
);
bot.use(hydrate());
bot.use(conversations());
bot.use(hydrateReply);
bot.use(autoQuote);

bot.api.config.use(parseMode('HTML'));
bot.api.config.use(autoRetry());

const { setMyCommands, registerCommands } = useCommands();
const { registerCallbacks } = useCallbacks();
const { registerInlineQueries } = useInlineQueries();

registerCommands(bot);
registerCallbacks(bot);
registerInlineQueries(bot);

bot.catch(async (err: BotError) => {
  const { ctx } = err;

  try {
    await ctx.reply('Произошла неизвестная ошибка...');
  } finally {
    console.error(`Error while handling update ${ctx.update.update_id}:`);

    const e = err.error;

    if (e instanceof GrammyError) {
      console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
      console.error('Could not contact Telegram:', e);
    } else {
      console.error('Unknown error:', e);
    }

    await bot.stop();

    process.exit(1);
  }
});

process.once('SIGINT', () => bot.stop());

process.once('SIGTERM', () => bot.stop());

try {
  await bot.start({
    drop_pending_updates: true,
    onStart: () => setMyCommands(bot)
  });
} catch (err) {
  console.error(err);

  await bot.stop();
}
