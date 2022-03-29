import {
    BaseScene,
    Markup
} from 'telegraf';
import { Extra } from 'telegraf/typings/telegram-types';
import { CallbackButton } from 'telegraf/typings/markup';
import { stripHtml } from 'string-strip-html';
import IBot from '../../../typings/TelegramBot';
import NSpell from '../../../typings/Spell';
import TContext = IBot.TContext;
import HTTPService from '../../utils/HTTPService';
import config from '../../.config';
import {
    DAMAGE_INFLICTS,
    SCHOOLS,
    CLASSES,
    SOURCES,
    TIMES,
    CLASSES_FROM
} from '../../locales/spell';

enum ACTIONS {
    ExitFromSearch = 'exitFromSearch',
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

                if (ctx.message.text === 'Закончить поиск заклинания') {
                    await this.leaveScene(ctx);

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
                const match = searchStr.match(/(?<spellName>.+?)(\[.+?])$/i);

                if (await this.trySendSpellFromSession(ctx, match)) {
                    return;
                }

                const apiOptions: NSpell.IRequest = {
                    search: searchStr as string,
                    order: [{
                        field: 'level',
                        direction: 'asc'
                    }, {
                        field: 'name',
                        direction: 'asc'
                    }]
                }

                const spellList: NSpell.ISpell[] = await this.http.post('/spells', apiOptions);

                let spell: NSpell.ISpell | undefined;

                if (spellList.length === 1) {
                    [ spell ] = spellList;

                    await this.sendSpellMessage(ctx, spell)

                    return;
                }

                if (spellList.length > 10) {
                    await ctx.replyWithHTML(`Я нашел слишком много заклинаний, где упоминается <b>«${
                        searchStr }»</b>... попробуй уточнить название`, {
                        reply_markup: { remove_keyboard: true }
                    });

                    await ctx.scene.reenter();

                    return;
                }

                if (spellList.length > 1) {
                    // eslint-disable-next-line no-param-reassign
                    ctx.scene.session.state.spellList = spellList;

                    await ctx.replyWithHTML(
                        // eslint-disable-next-line max-len
                        `Я нашел несколько заклинаний, где упоминается <b>«${ searchStr }»</b>`,
                        this.getSpellListMarkup(ctx.scene.session.state.spellList).extra()
                    );

                    await ctx.reply('Выбери подходящее из этого списка', {
                        reply_markup: {
                            ...Markup.inlineKeyboard([ this.EXIT_BUTTON ])
                        }
                    })

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

                await this.leaveScene(ctx);
            }
        });

        scene.action(ACTIONS.ExitFromSearch, async ctx => {
            await ctx.answerCbQuery();

            await ctx.reply('Ты вышел из режима поиска заклинания', {
                reply_markup: {
                    remove_keyboard: true
                }
            });

            await ctx.scene.leave();
        });

        scene.on('message', async ctx => {
            await ctx.reply('Это не похоже на название заклинания 🙃');

            await ctx.scene.reenter();
        });

        return scene;
    }

    private leaveScene = async (ctx: IBot.TContext) => {
        await ctx.reply('Ты вышел из режима поиска заклинания', {
            reply_markup: {
                remove_keyboard: true
            }
        });

        await ctx.scene.leave();
    }

    private trySendSpellFromSession = async (ctx: IBot.TContext, match: { groups: { spellName: string } }) => {
        if (
            ctx.scene.session.state?.spellList?.length
            && match?.groups?.spellName
        ) {
            const spell = ctx.scene.session.state.spellList
                .find((item: NSpell.ISpell) => item.name === match.groups.spellName.trim());

            if (!spell) {
                return false;
            }

            await this.sendSpellMessage(ctx, spell);

            return true
        }

        return false
    }

    private sendSpellMessage = async (ctx: IBot.TContext, spell: NSpell.ISpell) => {
        const spellMsg: string[] = this.getSpellMessage(spell);
        const originalObj = this.getOriginal(spell.englishName);

        try {
            for (let i = 0; i < spellMsg.length; i++) {
                let extra: Extra = {
                    disable_web_page_preview: true
                };

                if (i === spellMsg.length - 1) {
                    extra = {
                        ...extra,
                        reply_markup: {
                            ...Markup.inlineKeyboard([
                                [ Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z') ],
                                [ Markup.urlButton(originalObj.text, originalObj.url) ],
                                this.EXIT_BUTTON
                            ])
                        }
                    }
                }

                await ctx.replyWithHTML(spellMsg[i], extra);
            }
        } catch (err) {
            console.error(err);

            for (let i = 0; i < spellMsg.length; i++) {
                let extra: Extra = {
                    disable_web_page_preview: true
                };

                if (i === spellMsg.length - 1) {
                    extra = {
                        ...extra,
                        reply_markup: { remove_keyboard: true }
                    }
                }

                await ctx.reply(spellMsg[i], extra);
            }

            // eslint-disable-next-line max-len
            await ctx.reply('Произошла ошибка, поэтому я выслал тебе сырую версию сообщения заклинания... пожалуйста, сообщи нам об этом в Discord', {
                reply_markup: {
                    ...Markup.inlineKeyboard([[
                        Markup.urlButton('Discord-канал', 'https://discord.gg/zqBnMJVf3z')
                    ]])
                }
            });
            await this.leaveScene(ctx);
        }
    }

    private getSpellMessage = (spell: NSpell.ISpell): string[] => {
        const result: string[] = [ `<b>${ spell.name }</b> [<i>${ spell.englishName }</i>]` ];
        const updateMsg = (str: string) => {
            const index = result.length > 0 ? result.length - 1 : 0;

            if (result[index].length + str.length > 4000) {
                result[index + 1] = str;

                return;
            }

            result[index] += str;
        }

        updateMsg(`\n<i>${ this.getLevel(spell.level) }, ${ this.getSchool(spell.school) }${ spell?.meta?.ritual
            ? ' (ритуал)'
            : '' }</i>\n`);
        updateMsg(`\n<b>Источник:</b> ${ this.getSource(spell.source) } [${ spell.source }]`);

        if (spell?.damageInflict) {
            updateMsg(`\n<b>Тип урона:</b> ${ this.getDamageInflicts(spell.damageInflict) }`);
        }

        updateMsg(`\n<b>Время накладывания:</b> ${ this.getTimes(spell.time) }`);
        updateMsg(`\n<b>Дистанция:</b> ${ this.getRange(spell.range) }`);
        updateMsg(`\n<b>Длительность:</b> ${ this.getDuration(spell.duration) }`);
        updateMsg(`\n<b>Компоненты:</b> ${ this.getComponents(spell.components) }`);
        updateMsg(this.getClasses(spell.classes));

        this.getEntries(spell.entries).forEach(str => {
            updateMsg(`\n\n${ str }`)
        });

        if (spell?.entriesHigherLevel) {
            this.getEntries(spell.entriesHigherLevel.entries).forEach((str, index) => {
                updateMsg(`\n\n${!index ? '<b>На больших уровнях: </b>' : ''}${ str }`)
            });
        }

        return result;
    }

    private getSpellListMarkup = (spellList: NSpell.ISpell[]) => Markup.keyboard(
        [ ...spellList.map(spell => [ Markup.button(`${ spell.name } [${ spell.englishName }]`) ]) ]
    );

    private getDamageInflicts = (list: string[]): string => list.map((item: string) => (
        item in DAMAGE_INFLICTS
            ? DAMAGE_INFLICTS[item as keyof typeof DAMAGE_INFLICTS]
            : item)).join('; ');

    private getSchool = (name: string): string => (name in SCHOOLS
        ? SCHOOLS[name as keyof typeof SCHOOLS]
        : name);

    private getLevel = (level: number): string => (level ? `${ level } уровень` : 'Заговор');

    private getClass = (name: string): string => (name in CLASSES
        ? CLASSES[name as keyof typeof CLASSES]
        : name);

    private getSource = (source: string): string => (source in SOURCES
        ? SOURCES[source as keyof typeof SOURCES]
        : source)

    private getClasses = (classes: NSpell.IClass): string => {
        let res = '';

        Object.entries(classes).forEach(([ from, list ]) => {
            if (!Array.isArray(list) || !list.length) {
                return;
            }

            const fromStr = from in CLASSES_FROM
                ? CLASSES_FROM[from as keyof typeof CLASSES_FROM]
                : from;
            const str = list.map((classObj: NSpell.IClassItem) => {
                const { name, source } = classObj;
                const nameStr = this.getClass(name);

                return `${ nameStr } [${ source }]`;
            }).join('; ');

            res += `\n<b>${ fromStr }:</b> ${ str }`;
        });

        return res
    };

    private getTime = (time: NSpell.ITime): string => {
        const unit = time.unit in TIMES
            ? TIMES[time.unit as keyof typeof TIMES](time.number)
            : time.unit;

        return time?.condition
            ? `${ time.number } ${ unit }, ${ time.condition.trim() }`
            : `${ time.number } ${ unit }`
    }

    private getTimes = (times: NSpell.ITime[]): string => times.map(time => this.getTime(time)).join('; ')

    private getComponents = (components: NSpell.IComponents): string => {
        const { v, s, m } = components;
        const res = [];

        if (v) {
            res.push('вербальный');
        }

        if (s) {
            res.push('соматический');
        }

        if (m) {
            res.push(`материальный (${ m })`)
        }

        return res.join(', ');
    }

    private getRange = (range: NSpell.IRange): string => range.raw.toLowerCase()

    private getDuration = (durationList: NSpell.IDuration[]): string => durationList
        .map(duration => duration.raw.toLowerCase())
        .join('; ')

    private getEntries = (entries: string[]): string[] => {
        const tags = [ 'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'a', 'code', 'pre' ];
        return entries.map((str: string) => stripHtml(str, { ignoreTags: tags })
            .result
            .replaceAll('href="/', `href="${ config.baseURL }/`));
    }

    private getOriginal = (engName: string) => {
        const url = `${ config.baseURL }/spells/${ engName.replaceAll(' ', '_') }`;

        return {
            text: 'Оригинал на D&D5 Club',
            url
        }
    }
}
