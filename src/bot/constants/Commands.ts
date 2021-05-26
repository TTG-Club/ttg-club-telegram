import IBot from '../../types/bot';

export default class Commands {
    static SPELL = 'spell'

    static SPELL_BY_ID = 'spellById'

    static START = 'start'

    static HELP = 'help'

    static COMMANDS_LIST: IBot.ICommands = {
        [Commands.SPELL]: {
            command: Commands.SPELL,
            description: 'поиск заклинания',
            fullDescription: `/${Commands.SPELL} <i>&lt;название&gt;</i> - Поиск заклинания по его названию.`
        },
        [Commands.HELP]: {
            command: Commands.HELP,
            description: 'помощь',
            fullDescription: `/${Commands.HELP} - Описание команд.`
        }
    }
}
