import { InlineKeyboard, Keyboard } from 'grammy';

import { SOCIAL_LINKS } from '../../locales/about.js';
import { useDiceRoller } from '../../utils/useDiceRoller.js';
import { useHelpers } from '../../utils/useHelpers.js';
import helpCommand from '../base/help.js';

import type { ICommand } from '../../types/commands.js';
import type { IContext } from '../../types/telegram.js';
import type { Conversation } from '@grammyjs/conversations';

const COMMAND_NAME = 'dice';
const CANCEL_MSG = 'Закончить броски';

const { getUserMentionHtmlString, leaveScene } = useHelpers();
const { getRenderedMsg } = useDiceRoller();

const keyboard = new Keyboard()
  .text(CANCEL_MSG)
  .row()
  .text('d2')
  .text('d4')
  .text('d6')
  .text('d8')
  .row()
  .text('d10')
  .text('d12')
  .row()
  .text('пом')
  .text('d20')
  .text('пре')
  .placeholder('2d20, например...')
  .selected()
  .resized();

const helpReply = async (ctx: IContext) => {
  const msg =
    'Посмотри нашу <a href="https://ttg.club/info/telegram_spells_bot">статью</a>. ' +
    'Там ты сможешь найти подсказку, как пользоваться кубами. ' +
    '\nСохрани себе ссылку, чтобы не потерять 😉' +
    '\n\n<a href="https://ttg.club/info/telegram_spells_bot">https://ttg.club/info/telegram_spells_bot</a>';

  await ctx.reply(msg, {
    disable_notification: true,
    reply_markup: keyboard
  });
};

const handler = async (
  conversation: Conversation<IContext>,
  context: IContext
): Promise<boolean> => {
  if (!context.from) {
    return false;
  }

  const ctx = await conversation.waitFrom(context.from);

  if (ctx.hasCommand(helpCommand.command)) {
    await helpReply(ctx);

    return handler(conversation, context);
  }

  const { message } = ctx;

  if (!message?.text) {
    await conversation.skip({ drop: true });

    return handler(conversation, context);
  }

  if (message.text === CANCEL_MSG) {
    return false;
  }

  try {
    const msg = await getRenderedMsg(message.text);

    if (!msg) {
      await ctx.reply(
        'Произошла ошибка... попробуй еще раз или напиши нам в Discord-канал',
        {
          disable_notification: true,
          reply_markup: new InlineKeyboard().url(
            SOCIAL_LINKS.discord.label,
            SOCIAL_LINKS.discord.url
          )
        }
      );

      return false;
    }

    await ctx.reply(msg, {
      disable_notification: true,
      reply_markup: keyboard
    });

    return handler(conversation, context);
  } catch (err) {
    console.error(err);

    await ctx.reply(
      'В формуле броска кубиков ошибка, ' +
        `отправь команду /${helpCommand.command}, если не получается 😉`,
      {
        disable_notification: true,
        reply_markup: keyboard
      }
    );

    return handler(conversation, context);
  }
};

const diceCommand: ICommand = {
  command: COMMAND_NAME,
  description: 'Бросить кубики',
  fullDescription: `/${COMMAND_NAME} - Режим броска кубиков.`,
  order: 1,
  callback: ctx => ctx.conversation.enter(COMMAND_NAME),
  conversation: async (conversation, ctx) => {
    if (!ctx.from) {
      return;
    }

    await ctx.reply(
      `${getUserMentionHtmlString(ctx)} вошел(ла) в режим броска кубиков.` +
        '\nВыбирай кубик на клавиатуре или отправь мне формулу.',
      {
        disable_notification: true,
        reply_markup: keyboard
      }
    );

    await handler(conversation, ctx);
    await leaveScene(ctx);
  }
};

export default diceCommand;
