import TelegramBot from 'node-telegram-bot-api';
import { EventEmitter } from 'events';
import _ from 'lodash';
import Commands from './constants/Commands';
import BotHelper from '../helpers/BotHelper';
import CallbackTypes from './constants/CallbackTypes';

export default class Bot {
    protected readonly bot: TelegramBot;

    private readonly commands: TelegramBot.BotCommand[];

    protected readonly emitter: EventEmitter;

    public constructor() {
        try {
            this.bot = new TelegramBot(<string>process.env.TG_TOKEN, { polling: true });
        } catch (e) {
            console.error(e)

            throw Error(e)
        }

        this.emitter = new EventEmitter();

        this.commands = _.cloneDeep(Object.values(Commands.COMMANDS_LIST)).map(cmd => ({
            command: cmd.command,
            description: cmd.description
        }));

        this.init();
    }

    private init(): void {
        if (process.env.NODE_ENV === 'production') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.bot.sendMessage(process.env.TG_USER_ID, 'Я перезапустился! 👋🏻').then();
        }

        this.emitter.removeAllListeners();

        this.setupCommands();
        this.setupBotListeners();
    }

    private setupCommands(): void {
        this.bot.setMyCommands(this.commands)
            .then()
    }

    private setupBotListeners(): void {
        this.onError();
        this.onCallbackQuery();
        this.onCommand();
    }

    private onError(): void {
        this.bot.on('polling_error', error => {
            console.error(error);
        });
    }

    protected onCallbackQuery(): void {
        this.bot.on('callback_query', query => {
            const chatId = query.message?.chat.id;
            const text = query.data;
            const match = text?.split(/\s/);
            const type = Array.isArray(match) && match.length ? match[0] : null;
            const command = Array.isArray(match) && match.length ? match[1] : null;

            let argument = '';

            if (Array.isArray(match) && match.length && match[2]) {
                const slicedMatch = match.filter((item, index) => index !== 0 && index !== 1);

                argument = slicedMatch.join(' ');
            }

            if (!chatId) return;

            switch (type) {
                case CallbackTypes.SPELL_TYPE:
                    this.emitter.emit(CallbackTypes.SPELL_TYPE, {
                        chatId,
                        command,
                        argument,
                        query
                    });

                    break;

                case CallbackTypes.HELP_TYPE:
                    this.onHelp(chatId);

                    break;
                default:
                    this.answerServerError(chatId).then();

                    break;
            }
        });
    }

    private onCommand(): void {
        this.bot.onText(<RegExp>BotHelper.commandRegExp(Commands.START), msg => this.onStart(msg));
        this.bot.onText(<RegExp>BotHelper.commandRegExp(Commands.HELP), msg => this.onHelp(msg.chat.id));
    }

    private onStart(msg: TelegramBot.Message): void {
        const { chat: { id }} = msg;
        const username: string | undefined = msg.from?.first_name || msg.from?.username || undefined

        this.bot.sendMessage(id, `Рад видеть тебя здесь${username ? `, ${username}` : ''}! 😇`, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Показать список команд',
                        callback_data: `${CallbackTypes.HELP_TYPE} ${Commands.HELP}`
                    }]
                ]
            }
        }).then()
    }

    private onHelp(id: string | number): void {
        let message = '';

        Object.values(Commands.COMMANDS_LIST).forEach((cmd, index) => {
            message += `${index !== 0 ? '\n' : ''}${cmd.fullDescription}`
        })

        this.bot.sendMessage(id, message, {
            parse_mode: 'HTML'
        }).then()
    }

    protected answerCallbackQuery(id: string): void {
        this.bot.answerCallbackQuery(id).then();
    }

    protected answerEmptyArgument(id: string | number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.bot.sendMessage(id, 'Не хватает аргумента в команде. Могу показать список команд 🙃', {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: 'Список команд',
                            callback_data: `${CallbackTypes.HELP_TYPE} ${Commands.HELP}`
                        }]
                    ]
                }
            })
                .then(() => resolve())
                .catch(err => reject(err))
        })
    }

    protected answerServerError(id: string | number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.bot.sendMessage(id, 'Ошибка на сервере... Исправляем!')
                .then(() => resolve())
                .catch(err => reject(err))
        })
    }
}
