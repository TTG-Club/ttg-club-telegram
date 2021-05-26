import TelegramBot from 'node-telegram-bot-api';

declare namespace IBot {
    interface ICommand {
        command: string,
        description: string,
        fullDescription: string
    }

    interface ICommands {
        [key: string]: ICommand
    }

    interface ISpellQuery {
        chatId: number,
        command: string,
        argument: string
        query: TelegramBot.CallbackQuery,
    }
}

export default IBot
