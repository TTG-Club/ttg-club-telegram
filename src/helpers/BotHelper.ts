export default class BotHelper {
    static commandRegExp(name: string): RegExp {
        if (!name) {
            console.error('Пустая строка в RegExp команды');

            throw Error('Пустая строка в RegExp команды');
        }

        return new RegExp(`${name}[ ]?(.*)`)
    }
}
