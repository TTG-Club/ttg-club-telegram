import IBot from '../../../typings/TelegramBot';

export enum COMMAND_NAME {
    SPELL = 'spell',
    SPELL_BY_ID = 'spellById',
    DICE = 'dice',
    START = 'start',
    HELP = 'help',
}

export const COMMANDS_LIST: IBot.ICommands = {
    [COMMAND_NAME.SPELL]: {
        command: COMMAND_NAME.SPELL,
        description: 'Поиск заклинания',
        fullDescription: `/${ COMMAND_NAME.SPELL } - Команда для входа в режим поиска заклинаний.`
    },
    [COMMAND_NAME.DICE]: {
        command: COMMAND_NAME.DICE,
        description: 'Бросить кубики',
        fullDescription: `/${ COMMAND_NAME.DICE } - Команда для входа в режим броска кубиков.`
    },
    [COMMAND_NAME.HELP]: {
        command: COMMAND_NAME.HELP,
        description: 'Помощь',
        fullDescription: `/${ COMMAND_NAME.HELP } - Описание команд.`
    }
}
