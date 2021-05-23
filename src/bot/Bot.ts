import TelegramBot from 'node-telegram-bot-api';
import Commands from './constants/Commands';

export default class Bot {
    protected readonly bot: TelegramBot;

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
                switch_pm_parameter: 'help'
            }).then()
        })
    }

    private onCommand(): void {
        this.bot.onText(<RegExp>Bot.CommandRegExp(Commands.START), msg => this.resolveStart(msg));
    }

    static CommandRegExp(name: string): RegExp {
        if (!name) {
            console.error('Пустая строка в RegExp команды');

            return new RegExp(name);
        }

        return new RegExp(`${name} (.+)`)
    }

    private resolveStart(msg: TelegramBot.Message): void {
        const { chat: { id }} = msg;
        const username: string | undefined = msg.from?.first_name || msg.from?.username || undefined

        this.bot.sendMessage(id, `Рад видеть тебя здесь${username ? `, ${username}` : ''}! 😇`, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Вернуться в предыдущий чат',
                        switch_inline_query: 'Привет :)'
                    }]
                ]
            }
        }).then()
    }
}
