// import { Composer, Markup } from 'telegraf';
//
// import { COMMAND_NAME } from '../const/Commands.js';
// import SpellsMiddleware from '../middlewares/SpellsMiddleware.js';
// import HTTPService from '../utils/HTTPService.js';
//
// import type NSpell from '../types/Spell.js';
// import type IBot from '../types/TelegramBot.js';
// import type { InlineQueryResult } from 'telegraf/typings/telegram-types.js';
//
// const bot = new Composer<IBot.TContext>();
// const http = new HTTPService();
// const spellsMiddleware = new SpellsMiddleware();
//
// bot.inlineQuery(/.*/, async ctx => {
//   if (!ctx.inlineQuery?.query) {
//     await ctx.answerInlineQuery([]);
//
//     return;
//   }
//
//   const value: string = ctx.inlineQuery.query;
//
//   if (!value || value.length < 3) {
//     await ctx.answerInlineQuery([]);
//
//     return;
//   }
//
//   const apiOptions: NSpell.IRequest = {
//     search: value
//   };
//
//   const resp = await http.get('/spells', apiOptions);
//   const result: NSpell.ISpell[] = resp.spell;
//
//   const spells: InlineQueryResult[] = result
//     .map((spell, index) => {
//       const level = spellsMiddleware.getLevel(spell.level);
//       const school = spellsMiddleware.getSchool(spell.school);
//       const source = spellsMiddleware.getSource(spell.source);
//
//       const ritual = spell?.meta?.ritual ? '(ритуал)' : '';
//
//       let msg = spellsMiddleware.getSpellMessage(spell).messages.join();
//
//       const isBig = msg.length > 3750;
//
//       if (isBig) {
//         const add =
//           '...\n\n<b>Заклинание показано без форматирования, чтобы постараться уместить его в одно' +
//           ' сообщение и может быть обрезано, пожалуйста, посмотрите оригинал на сайте по кнопке ниже или' +
//           ' напишите боту в личные сообщения</b> 😉';
//
//         msg = spellsMiddleware.getSpellMessage(spell, true).messages.join();
//
//         msg = msg.slice(0, 3750).trim() + add;
//       }
//
//       return {
//         type: 'article',
//         id: String(index),
//         title: `${spell.name} [${spell.englishName}]`,
//         url: spellsMiddleware.getOriginal(spell.englishName),
//         hide_url: false,
//         description: `${level}, ${school} ${ritual}\n${source}`,
//         thumb_url: `${process.env.BASE_URL}/resources/assets/icon/avatar.png`,
//         input_message_content: {
//           message_text: msg,
//           parse_mode: 'HTML',
//           disable_web_page_preview: true
//         },
//         reply_markup: Markup.inlineKeyboard([
//           [
//             Markup.urlButton(
//               'Оригинал на TTG Club',
//               spellsMiddleware.getOriginal(spell.englishName)
//             )
//           ],
//           [
//             Markup.urlButton(
//               'Перейти к боту',
//               `https://t.me/${ctx.botInfo?.username}`
//             )
//           ]
//         ])
//       };
//     })
//     .slice(0, 49) as InlineQueryResult[];
//
//   await ctx.answerInlineQuery(spells, {
//     switch_pm_text: 'Перейти в бота',
//     switch_pm_parameter: COMMAND_NAME.SPELL
//   });
// });
//
// export default bot;
