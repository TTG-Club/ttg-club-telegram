import { Composer, Markup } from 'telegraf';
import { InlineQueryResult } from 'telegraf/typings/telegram-types';
import { COMMAND_NAME, INLINE_COMMAND_NAME } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';
import HTTPService from '../../utils/HTTPService';
import NSpell from '../../../typings/Spell';
import SpellsMiddleware from '../../middlewares/SpellsMiddleware';
import config from '../../.config';

const bot = new Composer<IBot.TContext>();
const http = new HTTPService();
const spellsMiddleware = new SpellsMiddleware();

bot.command(COMMAND_NAME.SPELL, async ctx => {
    await ctx.scene.leave();
    await ctx.scene.enter('findSpell');
});

bot.inlineQuery(new RegExp(`${ INLINE_COMMAND_NAME.SPELL } (.*)`), async ctx => {
    if (!ctx.match || !ctx.match[1]) {
        await ctx.answerInlineQuery([]);

        return;
    }

    const value: string = ctx.match[1];

    if (!value || value.length < 3) {
        await ctx.answerInlineQuery([]);

        return;
    }

    const apiOptions: NSpell.IRequest = {
        search: {
            exact: false,
            value
        },
        order: [{
            field: 'level',
            direction: 'asc'
        }, {
            field: 'name',
            direction: 'asc'
        }]
    };
    const result: NSpell.ISpell[] = await http.post('/spells', apiOptions);
    const spells: InlineQueryResult[] = result.map((spell, index) => {
        const level = spellsMiddleware.getLevel(spell.level);
        const school = spellsMiddleware.getSchool(spell.school);
        const source = spellsMiddleware.getSource(spell.source);
        const ritual = spell?.meta?.ritual
            ? '(ритуал)'
            : '';

        let msg = spellsMiddleware.getSpellMessage(spell, true).messages.join();

        const isBig = msg.length > 3750;

        if (isBig) {
            const add = '...\n\n<b>Заклинание показано без форматирования, чтобы постараться уместить его в одно'
                + ' сообщение и может быть обрезано, пожалуйста, посмотрите оригинал на сайте по кнопке ниже или'
                + ' напишите боту в личные сообщения</b> 😉';

            msg = msg.slice(0, 3750).trim() + add;
        }

        return {
            type: 'article',
            id: String(index),
            title: `${ spell.name } [${ spell.englishName }]`,
            url: spellsMiddleware.getOriginal(spell.englishName),
            hide_url: false,
            description: `${ level }, ${ school } ${ ritual }`
                + `\n${ source }`,
            thumb_url: `${ config.baseURL }/resources/assets/icon/avatar.png`,
            input_message_content: {
                message_text: msg,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            },
            reply_markup: Markup.inlineKeyboard([
                [ Markup.urlButton('Оригинал на D&D5 Club', spellsMiddleware.getOriginal(spell.englishName)) ],
                [ Markup.urlButton('Перейти к боту', `https://t.me/${ ctx.botInfo?.username }`) ]
            ]),
        }
    });

    await ctx.answerInlineQuery(spells, {
        switch_pm_text: 'Перейти в бота',
        switch_pm_parameter: COMMAND_NAME.SPELL
    });
})

export default bot;
