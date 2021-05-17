import TelegramBot from 'node-telegram-bot-api';
import DB from '../types/db';
import { Spell } from '../db/models/spells';
import StringManipulation from '../helpers/StringManipulation';
import Commands from './constants/Commands';
import DBHelper from '../helpers/DBHelper';

export default class Bot {
    private readonly bot: TelegramBot;

    public constructor() {
        this.bot = new TelegramBot(<string>process.env.TG_TOKEN, { polling: true });

        this.init();
    }

    private init(): void {
        this.setupBotListeners();
    }

    private setupBotListeners(): void {
        this.onError();
        this.onInlineQuery();
        this.onCommand();
    }

    private onError(): void {
        this.bot.on('polling_error', error => {
            console.log(error);
        });
    }

    private onInlineQuery(): void {
        this.bot.on('inline_query', (query: TelegramBot.InlineQuery) => {
            this.bot.answerInlineQuery(query.id, [], {
                cache_time: 0,
                switch_pm_text: 'Перейти в личные сообщения',
                switch_pm_parameter: 'spell'
            }).then()
        })
    }

    private onCommand(): void {
        this.bot.onText(<RegExp>Bot.CommandRegExp(Commands.SPELL), (msg, match) => this.resolveSpell(msg, match));
        this.bot.onText(<RegExp>Bot.CommandRegExp(Commands.START), msg => this.resolveStart(msg));
    }

    static CommandRegExp(name: string): RegExp {
        if (!name) {
            console.error('Пустая строка в RegExp команды');

            return new RegExp(name);
        }

        return new RegExp(`${name} (.+)`)
    }

    private resolveSpell(msg: TelegramBot.Message, match: RegExpExecArray | null): void {
        const { chat: { id }} = msg;

        if (!DBHelper.isConnected()) {
            this.bot.sendMessage(id, 'Я потерял базу данных... 🤯 Скоро найду!')
                .then();
        }

        if (!match || !match[1]) {
            this.bot.sendMessage(id, 'Я не смог найти такое заклинание 😭')
                .then();

            return;
        }

        const spellName: string = match[1];

        this.getSpellInfo(spellName)
            .then(res => {
                if (typeof res === 'string') {
                    this.bot.sendMessage(id, res)
                        .then();
                } else {
                    res.forEach((spell: DB.ISpell) => {
                        const newMsg: string = Bot.getSpellMessage(spell);

                        this.bot.sendMessage(id, newMsg)
                            .then();
                    })
                }
            })
            .catch(err => {
                this.bot.sendMessage(id, err)
                    .then(() => {
                        console.error(err)
                    });
            });
    }

    private getSpellInfo = (name: string) => new Promise<string | DB.ISpell[]>((resolve, reject) => {
        if (!name) {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject('Название способности не указано');

            return;
        }

        Spell.find({
            $or: [{
                name: new RegExp(name, 'i')
            }, {
                aliases: new RegExp(name, 'i')
            }]
        }, (err: any, res: DB.ISpell[]) => {
            if (err) {
                console.error(err);

                reject(err);
            } else if (res.length === 1) {
                resolve(Bot.getSpellMessage(res[0]));
            } else if (res.length > 1) {
                resolve(res);
            } else {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject('Я не смог найти такое заклинание 😭')
            }
        });
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

    private resolveStart(msg: TelegramBot.Message): void {
        const { chat: { id }} = msg;
        const username: string | undefined = msg.from?.first_name || msg.from?.username || undefined

        this.bot.sendMessage(id, `Рад видеть тебя здесь${username ? `, ${username}` : ''}! 😇`, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Вернуться в предыдущий чат',
                        switch_inline_query: '/spell'
                    }]
                ]
            }
        }).then()
    }
}
