import IBot from '../../types/bot';

export default class Commands {
    static SPELL = 'spell'

    static SPELL_BY_ID = 'spellById'

    static DICE = 'dice'

    static START = 'start'

    static HELP = 'help'

    static COMMANDS_LIST: IBot.ICommands = {
        [Commands.SPELL]: {
            command: Commands.SPELL,
            description: 'Поиск заклинания',
            fullDescription: `/${Commands.SPELL} - Поиск заклинания по его названию.`
        },
        [Commands.DICE]: {
            command: Commands.DICE,
            description: 'Бросить кубики',
            fullDescription: `/${Commands.DICE} - Бросок кубиков.`
        },
        [Commands.HELP]: {
            command: Commands.HELP,
            description: 'Помощь',
            fullDescription: `/${Commands.HELP} - Описание команд.`
        }
    }
}
