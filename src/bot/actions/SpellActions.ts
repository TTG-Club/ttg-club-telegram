import TelegramBot, { InlineKeyboardButton } from 'node-telegram-bot-api';
import Bot from '../Bot';
import DBHelper from '../../helpers/DBHelper';
import DB from '../../types/db';
import { Spell } from '../../db/models/spells';
import StringManipulation from '../../helpers/StringManipulation';
import Commands from '../constants/Commands';

export default class SpellActions extends Bot {
    constructor() {
        super();

        this.setupListeners();
    }

    private setupListeners() {
        this.bot.onText(<RegExp>Bot.CommandRegExp(Commands.SPELL), (msg, match) => this.onSpell(msg, match));
        this.bot.on('callback_query', query => this.resolveCallbackQuery(query))
    }

    private instanceOfSpellList = (list: any): list is DB.ISpell[] => {
        let status = true;

        if (!Array.isArray(list) || !list.length) return false;

        list.forEach((item: any) => {
            if (!status) return;

            if (!this.instanceOfSpell(item)) status = false;
        });

        return status
    }

    private instanceOfSpell = (spell: any): spell is DB.ISpell => 'name' in spell;

    private onSpell(msg: TelegramBot.Message, match: RegExpExecArray | null): void {
        const chatId = msg.chat.id;

        if (!DBHelper.isConnected()) {
            this.bot.sendMessage(chatId, 'Я потерял базу данных... 🤯 Скоро найду!')
                .then();
        }

        if (!match || !match[1]) {
            this.bot.sendMessage(chatId, 'Я не смог найти такое заклинание 😭')
                .then();

            return;
        }

        const spellName: string = match[1];

        if (spellName.length < 3) {
            this.bot.sendMessage(chatId, 'Слишком короткое название для заклинания.')
                .then();

            return;
        }

        this.getSpellList(spellName)
            .then(res => {
                if (this.instanceOfSpellList(res)) {
                    const keyboard: TelegramBot.InlineKeyboardButton[][] = SpellActions.getSpellsKeyboard(res);

                    this.bot.sendMessage(chatId, 'Выбери более подходящий вариант', {
                        reply_markup: {
                            inline_keyboard: keyboard
                        }
                    }).then();
                }

                if (this.instanceOfSpell(res)) {
                    this.bot.sendMessage(chatId, SpellActions.getSpellMessage(res))
                        .then();
                }
            })
            .catch(err => {
                this.bot.sendMessage(chatId, err)
                    .then(() => {
                        console.error(err)
                    });
            });
    }

    private onSpellById(chatId: number, spellId: string): void {
        if (!DBHelper.isConnected()) {
            this.bot.sendMessage(chatId, 'Я потерял базу данных... 🤯 Скоро найду!')
                .then();
        }

        this.getSpellList(spellId, 'id')
            .then(res => {
                const instanceOfSpell = (spell: any): spell is DB.ISpell => 'name' in spell;

                if (instanceOfSpell(res)) {
                    this.bot.sendMessage(chatId, SpellActions.getSpellMessage(res)).then();
                }
            })
            .catch(err => {
                this.bot.sendMessage(chatId, err)
                    .then(() => {
                        console.error(err)
                    });
            });
    }

    // eslint-disable-next-line max-len
    private getSpellList = (value: string, field = 'name') => new Promise<string | DB.ISpell | DB.ISpell[]>((resolve, reject) => {
        if (!value) {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject('Название способности не указано');

            return;
        }

        switch (field) {
            case 'id':
                Spell.findById(DBHelper.toObjectId(value), (err: any, res: DB.ISpell[]) => {
                    if (err) {
                        console.error(err);

                        // eslint-disable-next-line prefer-promise-reject-errors
                        reject('Произошла какая-то ошибка...');
                    } else if (res) {
                        resolve(res);
                    } else {
                        // eslint-disable-next-line prefer-promise-reject-errors
                        reject('Я не смог найти такое заклинание 😭')
                    }
                }).sort({
                    level: 1,
                    name: 1
                });

                break;

            default:
                Spell.find({
                    $or: [{
                        name: new RegExp(value, 'i')
                    }, {
                        aliases: new RegExp(value, 'i')
                    }]
                }, (err: any, res: DB.ISpell[]) => {
                    if (err) {
                        console.error(err);

                        reject(err);
                    } else if (res.length === 1) {
                        resolve(res[0]);
                    } else if (res.length >= 1 && res.length <= 20) {
                        resolve(res);
                    } else if (res.length > 20) {
                        // eslint-disable-next-line prefer-promise-reject-errors
                        reject(
                            `Я нашел слишком много заклинаний, где упоминается "${value}". Попробуй уточнить название.`
                        );
                    } else {
                        // eslint-disable-next-line prefer-promise-reject-errors
                        reject('Я не смог найти такое заклинание 😭')
                    }
                }).sort({
                    level: 1,
                    name: 1
                });

                break;
        }
    })

    private static getSpellMessage(spell: DB.ISpell): string {
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

    private static getSpellsKeyboard(spells: DB.ISpell[]): TelegramBot.InlineKeyboardButton[][] {
        const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

        spells.forEach(spell => {
            const button: InlineKeyboardButton = {
                text: spell.name,
                // eslint-disable-next-line no-underscore-dangle
                callback_data: `${Commands.SPELL_BY_ID} ${spell._id}`
            };

            keyboard.push([button]);
        });

        return keyboard
    }

    private resolveCallbackQuery(query: TelegramBot.CallbackQuery): void {
        const chatId = query.message?.chat.id;
        const text = query.data;
        const match = text?.split(/\s/);
        const command = Array.isArray(match) && match.length ? match[0] : null;
        const param = Array.isArray(match) && match.length ? match[1] : null;

        if (!chatId || !command) return;

        switch (command) {
            case Commands.SPELL_BY_ID:
                if (param) this.onSpellById(chatId, param);

                break;
            default:
                break;
        }
    }
}
