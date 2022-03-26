import { BaseScene, Markup } from 'telegraf';
import { Button, CallbackButton } from 'telegraf/typings/markup';
import { stripHtml } from 'string-strip-html';
import IBot from '../../../typings/TelegramBot';
import NSpell from '../../../typings/Spell';
import TContext = IBot.TContext;
import HTTPService from '../../utils/HTTPService';

enum ACTIONS {
    ExitFromSearch = 'exitFromSearch',
    SpellByName = 'spellByName',
}

const DAMAGE_TYPE = {
    fair: 'огонь',
    cold: 'холод',
    lightning: 'электричество',
    poison: 'яд',
    acid: 'кислота',
    sound: 'звук',
    necrotic: 'некротическая энергия',
    psychic: 'психическая энергия',
    bludgeoning: 'дробящий',
    piercing: 'колющий',
    slashing: 'рубящий',
    physical: 'дробящий, колющий и рубящий урон от немагических атак',
    no_nosilver: 'дробящий, колющий и рубящий урон от немагических атак, а также от немагического оружия, которое при этом не посеребрено',
    no_damage: 'без урона',
    radiant: 'излучение',
    no_admantit: 'дробящий, колющий и рубящий урон от немагических атак, а также от немагического оружия, которое при этом не изготовлено из адамантина',
    physical_magic: 'дробящий, колющий и рубящий урон от магического оружия',
    piercing_good: 'колющий от магического оружия, используемого добрыми существами',
    magic: 'урон от заклинаний',
    dark: 'дробящий, колющий и рубящий, пока находится в области тусклого света или тьмы',
    force: 'силовое поле',
    metal_weapon: 'дробящий, колющий и рубящий урон от оружия из металла',
}

const SCHOOLS = {
    conjuration: 'вызов',
    evocation: 'воплощение',
    illusion: 'иллюзия',
    necromancy: 'некромантия',
    abjuration: 'ограждение',
    enchantment: 'очарование',
    transmutation: 'преобразование',
    divination: 'прорицание'
}

export default class SpellScenes {
    private readonly EXIT_BUTTON: CallbackButton[] = [
        Markup.callbackButton('Закончить поиск заклинания', ACTIONS.ExitFromSearch)
    ];

    private readonly http: HTTPService = new HTTPService();

    public findSpell() {
        const scene = new BaseScene<TContext>('findSpell');

        scene.enter(async ctx => {
            await ctx.reply(
                'Введи название заклинания (минимум 3 буквы)',
                Markup.inlineKeyboard([ this.EXIT_BUTTON ]).extra()
            );
        });

        scene.on('text', async ctx => {
            try {
                if (!ctx.message || !('text' in ctx.message)) {
                    await ctx.reply('Произошла какая-то ошибка...', {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });

                    await ctx.scene.reenter();

                    return;
                }

                if (ctx.message.text.length < 3) {
                    await ctx.reply('Название слишком короткое', {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });

                    await ctx.scene.reenter();

                    return;
                }

                // eslint-disable-next-line no-param-reassign
                ctx.scene.session.state.searchStr = ctx.message.text;

                const { searchStr } = ctx.scene.session.state;

                const spellList: NSpell.ISpell[] = await this.http.post('/spells', {
                    search: searchStr as string
                });

                let spell: NSpell.ISpell | undefined;

                if (spellList.length === 1) {
                    [ spell ] = spellList;

                    const spellMsg: string = this.getSpellMessage(spell);

                    await ctx.replyWithHTML(spellMsg, {
                        disable_web_page_preview: true
                    });
                    await ctx.scene.leave();

                    return;
                }

                if (spellList.length > 10) {
                    await ctx.reply(`Я нашел слишком много заклинаний, где упоминается <b>«${ searchStr }»</b>... Попробуй уточнить название`);

                    await ctx.scene.reenter();

                    return;
                }

                if (spellList.length > 1) {
                    // eslint-disable-next-line no-param-reassign
                    ctx.scene.session.state.spellList = spellList;

                    await ctx.replyWithHTML(
                        // eslint-disable-next-line max-len
                        `Я нашел несколько заклинаний, где упоминается <b>«${ searchStr }»</b>.\nВыбери подходящее из этого списка:`,
                        this.getSpellListMarkup(spellList).extra()
                    );

                    return;
                }

                await ctx.reply('Я не смог найти такое заклинание...');

                await ctx.scene.reenter();
            } catch (err) {
                console.error(err);

                await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз', {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });

                await ctx.scene.leave();
            }
        });

        scene.action(/.*/, async (ctx, next) => {
            await ctx.answerCbQuery();

            await next();
        });

        scene.action(new RegExp(`^${ACTIONS.SpellByName} (.+)`), async ctx => {
            if (!Array.isArray(ctx.match) || !ctx.match.length) {
                await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз', {
                    reply_markup: {
                        remove_keyboard: true
                    }
                })

                await ctx.scene.leave();

                return;
            }

            const { match } = ctx;
            const spell = ctx.scene.session.state.spellList
                .find((item: NSpell.ISpell) => item.name === match[1]);

            await ctx.editMessageText(this.getSpellMessage(spell), {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                reply_markup: this.getSpellListMarkup(ctx.scene.session.state.spellList)
            });
        });

        scene.action(ACTIONS.ExitFromSearch, async ctx => {
            await ctx.editMessageReplyMarkup(undefined);
            await ctx.reply('Ты вышел из режима поиска заклинания');

            await ctx.scene.leave();
        });

        scene.on('message', async ctx => {
            await ctx.reply('Это не похоже на название заклинания 🙃');

            await ctx.scene.reenter();
        })

        return scene;
    }

    private getSpellMessage = (spell: NSpell.ISpell): string => {
        let msg = `<b>${ spell.name }</b> [<i>${ spell.englishName }</i>]`;

        msg += `\n<i>${ this.getLevel(spell.level) }, ${ this.getSchool(spell.school) }</i>\n`;
        msg += `\n<b>Время накладывания:</b> ${ JSON.stringify(spell.time) }`;
        msg += `\n<b>Дистанция:</b> ${ JSON.stringify(spell.range) }`;
        msg += `\n<b>Длительность:</b> ${ JSON.stringify(spell.duration) }`;
        msg += `\n<b>Классы:</b> ${ JSON.stringify(spell.classes.fromClassList) }`;
        msg += `\n<b>Источник:</b> ${ spell.source }`;

        if (spell.damageInflict) {
            msg += `\n<b>Тип урона:</b> ${ this.getDamageType(spell.damageInflict) }`;
        }

        msg += `\n\n${ this.getEntries(spell.entries) }`;
        msg += this.getOriginal(spell.englishName);

        return msg
    }

    private getSpellListMarkup = (spellList: NSpell.ISpell[]) => Markup.inlineKeyboard(
        [
            ...spellList.map(spell => [
                Markup.callbackButton(spell.name, `${ACTIONS.SpellByName} ${spell.name}`)
            ]),
            this.EXIT_BUTTON
        ]
    );

    private getDamageType = (list: string[]): string => list.map((item: string) => (item in DAMAGE_TYPE
        ? DAMAGE_TYPE[item as keyof typeof DAMAGE_TYPE]
        : item)).join('; ');

    private getSchool = (name: string): string => (name in SCHOOLS ? SCHOOLS[name as keyof typeof SCHOOLS] : name);

    private getLevel = (level: number): string => (level ? `${ level } уровень` : 'Заговор');

    private getEntries = (entries: string[]): string => {
        const tags = [ 'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'a', 'code', 'pre' ];
        return entries.map((str: string) => stripHtml(str, { ignoreTags: tags })
            .result
            .replaceAll('href="/', `href="${ <string>process.env.SITE_URL }/`))
            .join('\n\n');
    }

    private getOriginal = (engName: string): string => {
        const url = `${ process.env.SITE_URL }/spells/${ engName.replaceAll(' ', '_') }`;

        return `\n\n—————————\n<b>Источник:</b> ${ url }`
    }
}
