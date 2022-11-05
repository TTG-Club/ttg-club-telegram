import type IBot from '@/typings/TelegramBot';

export enum COMMAND_NAME {
  SPELL = 'spell',
  DICE = 'dice',
  HELP = 'help',
  ABOUT = 'about'
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
  [COMMAND_NAME.HELP]: {
    command: COMMAND_NAME.HELP,
    description: 'Помощь',
    fullDescription: `/${ COMMAND_NAME.HELP } - Описание команд.`
  }
};
