import TelegramBot, { InlineKeyboardButton } from 'node-telegram-bot-api';
import Bot from '../Bot';
import DBHelper from '../../helpers/DBHelper';
import DB from '../../types/db';
import { Spell } from '../../db/models/spells';
import StringManipulation from '../../helpers/StringManipulation';
import Commands from '../constants/Commands';
import BotHelper from '../../helpers/BotHelper';
import CallbackTypes from '../constants/CallbackTypes';
import IBot from '../../types/bot';
import ISpellQuery = IBot.ISpellQuery;

function instanceOfSpell(spell: any): spell is DB.ISpell {
    return 'name' in spell;
}

function instanceOfSpellList(list: any): list is DB.ISpell[] {
    let status = true;

    if (!Array.isArray(list) || !list.length) return false;

    list.forEach((item: any) => {
        if (!status) return;

        if (!instanceOfSpell(item)) status = false;
    });

    return status
}

export default class SpellActions extends Bot {
    constructor() {
        super();

        this.setupListeners();
    }

    private setupListeners() {
        this.bot.onText(<RegExp>BotHelper.commandRegExp(Commands.SPELL), (msg, match) => this.onSpell(msg, match));

        this.emitter.on(CallbackTypes.SPELL_TYPE, query => {
            this.resolveCallbackQuery(query)
                .then(() => this.answerCallbackQuery(query.query.id))
                .catch(() => this.answerServerError(query.chatId))
        })
    }

    private onSpell(msg: TelegramBot.Message, match: RegExpExecArray | null): void {
        const chatId = msg.chat.id;

        if (!DBHelper.isConnected()) {
            this.bot.sendMessage(chatId, 'Я потерял базу данных... 🤯 Скоро найду!')
                .then();

            return;
        }

        if (!match) {
            this.bot.sendMessage(chatId, 'Я не смог найти такое заклинание 😭')
                .then();

            return;
        }

        if (!match[1]) {
            this.answerEmptyArgument(chatId)
                .then();

            return;
        }

        const spellName: string = match[1];

        if (spellName.length < 3) {
            this.bot.sendMessage(chatId, 'Слишком короткое название для заклинания.')
                .then()

            return;
        }

        this.getSpellList(spellName)
            .then(res => {
                if (instanceOfSpellList(res)) {
                    const keyboard: TelegramBot.InlineKeyboardButton[][] = SpellActions.getSpellsKeyboard(res);

                    this.bot.sendMessage(chatId, 'Выбери более подходящий вариант', {
                        reply_markup: {
                            inline_keyboard: keyboard
                        }
                    }).then();
                }

                if (instanceOfSpell(res)) {
                    this.bot.sendMessage(chatId, SpellActions.getSpellMessage(res))
                        .then();
                }
            })
            .catch(err => {
                this.bot.sendMessage(chatId, err)
                    .then(() => {
                        console.error(err);
                    })
            });
    }

    private onSpellById(chatId: number, spellId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!DBHelper.isConnected()) {
                this.bot.sendMessage(chatId, 'Я потерял базу данных... 🤯 Скоро найду!')
                    .then(() => reject())
                    .catch(err => reject(err));
            }

            this.getSpellList(spellId, 'id')
                .then(res => {
                    if (instanceOfSpell(res)) {
                        this.bot.sendMessage(chatId, SpellActions.getSpellMessage(res))
                            .then(() => {
                                resolve()
                            })
                            .catch(err => reject(err));
                    } else {
                        reject()
                    }
                })
                .catch(err => {
                    this.bot.sendMessage(chatId, err)
                        .then(() => {
                            console.error(err);

                            reject(err);
                        })
                        .catch(error => reject(error));
                });
        })
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
                callback_data: `${CallbackTypes.SPELL_TYPE} ${Commands.SPELL_BY_ID} ${spell._id}`
            };

            keyboard.push([button]);
        });

        return keyboard
    }

    private resolveCallbackQuery(data: ISpellQuery): Promise<void> {
        return new Promise((resolve, reject) => {
            const { chatId, command, argument } = data;

            if (!chatId || !command) {
                reject();

                return;
            }

            switch (command) {
                case Commands.SPELL_BY_ID:
                    if (argument) {
                        this.onSpellById(chatId, argument)
                            .then(() => resolve())
                            .catch(err => reject(err));
                    } else {
                        reject();
                    }

                    break;
                default:
                    reject();

                    break;
            }
        })
    }
}
