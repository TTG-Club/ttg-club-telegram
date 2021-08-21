import { Markup, Telegraf } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/src/core/types/typegram';
import Commands from '../constants/Commands';
import BotClass from '../BotClass';
import IBot from '../../types/bot';
import IDB from '../../types/db';
import StringManipulation from '../../helpers/StringManipulation';
import SpellQueries from '../../db/queries/SpellQueries';

export default class SpellActions {
    private readonly bot: Telegraf<IBot.ISessionContext>;

    constructor() {
        this.bot = BotClass.bot;

        this.registerCommands();
        this.registerActions();
    }

    private registerCommands() {
        try {
            this.bot.command(Commands.SPELL, async ctx => {
                await ctx.scene.leave();
                await ctx.scene.enter('findSpell');
            })
        } catch (err) {
            throw new Error(err)
        }
    }

    private registerActions() {
        try {
            this.bot.action(new RegExp(`/${Commands.SPELL_BY_ID} (.+)`), async ctx => {
                ctx.answerCbQuery();

                const spell = await SpellQueries.getSpellByID(ctx.match[1]);

                const msg = SpellActions.formatSpellMessage(spell);

                await ctx.replyWithHTML(msg);
            })
        } catch (err) {
            throw new Error(err)
        }
    }

    static formatSpellMessage = (spell: IDB.ISpell): string => {
        const spellLevel: string = 'level' in spell && spell.level ? `${spell.level} уровень` : 'Заговор';

        let reply = `${StringManipulation.capitalizeFirstLetter(spell.name)} (${spellLevel})\n`;

        if ('source' in spell && spell.source) {
            reply += `\nИсточник: ${spell.source};`;
        }

        if ('school' in spell && spell.school) {
            reply += `\nШкола: ${spell.school};`;
        }

        if ('castingTime' in spell && spell.castingTime) {
            reply += `\nВремя применения: ${spell.castingTime};`;
        }

        if ('duration' in spell && spell.duration) {
            reply += `\nДлительность: ${spell.duration};`;
        }

        if ('range' in spell && spell.range) {
            reply += `\nДальность: ${spell.range};\n`;
        }

        if ('materials' in spell && spell.materials) {
            reply += `\nМатериалы: ${spell.materials};\n`;
        }

        if ('text' in spell && spell.text) {
            reply += `\n${spell.text}`;
        }

        return reply
    }

    static getSpellListMarkup = (spellList: IDB.ISpell[]): Markup.Markup<InlineKeyboardMarkup> => Markup.inlineKeyboard(
        // eslint-disable-next-line no-underscore-dangle
        spellList.map(spell => [Markup.button.callback(spell.name, `/${Commands.SPELL_BY_ID} ${spell._id}`)])
    )
}
