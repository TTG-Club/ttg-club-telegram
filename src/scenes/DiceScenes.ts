import { BaseScene, Markup } from 'telegraf';
import type { Button } from 'telegraf/typings/markup';
import type IBot from '@/typings/TelegramBot';
import DiceRollerMiddleware from '@/middlewares/DiceRollerMiddleware';
import BaseHandler from '@/utils/BaseHandler';
import TelegrafHelpers from '@/utils/TelegrafHelpers';
import { COMMAND_NAME } from '@/constants/Commands';
import { SOCIAL_LINKS } from '@/locales/about';

enum ACTIONS {
  ExitFromRoller = '❌ Закончить броски',
}

enum CALLBACK_ACTIONS {
  ExitFromRoller = 'exitFromRoller'
}

const EXIT_BUTTON: Button[] = [Markup.button(ACTIONS.ExitFromRoller)];

const LEAVE_MSG = 'закончил(а) бросать кубики';

const getDiceKeyboard = () => ([
  EXIT_BUTTON,
  [
    Markup.button('d2'),
    Markup.button('d4'),
    Markup.button('d6'),
    Markup.button('d8')
  ],
  [Markup.button('d10'), Markup.button('d12')],
  [
    Markup.button('пом'),
    Markup.button('d20'),
    Markup.button('пре')
  ]
]);

const scene = new BaseScene<IBot.TContext>('diceRoll');
const diceRoll = new DiceRollerMiddleware();

scene.enter(async ctx => {
  const userName = TelegrafHelpers.getUserMentionHTMLString(ctx);

  await ctx.replyWithHTML(`${ userName } вошел(ла) в режим броска кубиков.`
    + '\nВыбирай кубик на клавиатуре или отправь мне формулу', {
    reply_to_message_id: ctx.message?.message_id,
    disable_notification: true,
    reply_markup: {
      keyboard: getDiceKeyboard(),
      input_field_placeholder: '2d20, например...',
      resize_keyboard: true,
      selective: true
    }
  });
});

scene.help(async ctx => {
  const msg = 'Посмотри нашу <a href="https://ttg.club/info/telegram_spells_bot">статью</a>. '
    + 'Там ты сможешь найти подсказку, как пользоваться кубами. '
    + '\nСохрани себе ссылку, чтобы не потерять 😉'
    + '\n\n<a href="https://ttg.club/info/telegram_spells_bot">https://ttg.club/telegram_bot</a>';

  await ctx.replyWithHTML(msg, {
    reply_to_message_id: ctx.message?.message_id,
    disable_notification: true,
    reply_markup: {
      keyboard: getDiceKeyboard(),
      input_field_placeholder: '2d20, например...',
      resize_keyboard: true,
      selective: true
    }
  });
});

scene.hears(ACTIONS.ExitFromRoller, async ctx => {
  await BaseHandler.leaveScene(ctx, LEAVE_MSG);
});

scene.on('text', async ctx => {
  if (!ctx.message || !('text' in ctx.message)) {
    await ctx.reply('Произошла какая-то ошибка...', {
      disable_notification: true
    });

    await BaseHandler.leaveScene(ctx, LEAVE_MSG);

    return;
  }

  try {
    const msg = await diceRoll.getDiceMsg(ctx.message.text);

    if (!msg) {
      await ctx.reply('Произошла ошибка... попробуй еще раз или напиши нам в Discord-канал', {
        reply_to_message_id: ctx.message.message_id,
        disable_notification: true,
        reply_markup: Markup
          .inlineKeyboard([[Markup.urlButton(SOCIAL_LINKS.discord.label, SOCIAL_LINKS.discord.url)]])
      });

      await BaseHandler.leaveScene(ctx, LEAVE_MSG);

      return;
    }

    await ctx.replyWithHTML(msg, {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true,
      reply_markup: {
        keyboard: getDiceKeyboard(),
        input_field_placeholder: '2d20, например...',
        resize_keyboard: true,
        selective: true
      }
    });
  } catch (err) {
    await ctx.reply('В формуле броска кубиков ошибка, '
      + `отправь команду /${ COMMAND_NAME.HELP }, если не получается 😉`, {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true,
      reply_markup: {
        keyboard: getDiceKeyboard(),
        input_field_placeholder: '2d20, например...',
        resize_keyboard: true,
        selective: true
      }
    });
  }
});

scene.action(CALLBACK_ACTIONS.ExitFromRoller, async ctx => {
  await ctx.answerCbQuery();

  await BaseHandler.leaveScene(ctx, LEAVE_MSG);
});

export default scene;
