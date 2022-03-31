import IBot from '../../../typings/TelegramBot';

export enum COMMAND_NAME {
    SPELL = 'spell',
    DICE = 'dice',
    HELP = 'help',
    ABOUT = 'about',
    INLINE = 'inline'
}

export enum INLINE_COMMAND_NAME {
    SPELL= 'заклинание'
}

export const COMMANDS_LIST: IBot.ICommands = {
    [COMMAND_NAME.SPELL]: {
        command: COMMAND_NAME.SPELL,
        description: 'Поиск заклинания',
        fullDescription: `/${ COMMAND_NAME.SPELL } - Режим поиска заклинаний.`
    },
    [COMMAND_NAME.DICE]: {
        command: COMMAND_NAME.DICE,
        description: 'Бросить кубики',
        fullDescription: `/${ COMMAND_NAME.DICE } - Режим броска кубиков.`
    },
    [COMMAND_NAME.ABOUT]: {
        command: COMMAND_NAME.ABOUT,
        description: 'О боте',
        fullDescription: `/${ COMMAND_NAME.ABOUT } - Небольшая информация о боте.`
    },
    [COMMAND_NAME.INLINE]: {
        command: COMMAND_NAME.INLINE,
        description: 'Инлайн команды',
        fullDescription: `/${ COMMAND_NAME.INLINE } - Помощь по инлайн командам`
    },
    [COMMAND_NAME.HELP]: {
        command: COMMAND_NAME.HELP,
        description: 'Помощь',
        fullDescription: `/${ COMMAND_NAME.HELP } - Описание команд.`
    },
}

export const INLINE_COMMAND_LIST: IBot.ICommands = {
    [INLINE_COMMAND_NAME.SPELL]: {
        command: INLINE_COMMAND_NAME.SPELL,
        description: 'Поиск заклинаний',
        fullDescription: `@dnd5club_bot ${ INLINE_COMMAND_NAME.SPELL } [название заклинания]`
    }
}
