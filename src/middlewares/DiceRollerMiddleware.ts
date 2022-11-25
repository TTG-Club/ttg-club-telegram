import { DiceRoll } from '@dice-roller/rpg-dice-roller';

export default class DiceRollerMiddleware {
  public getDiceMsg = async (str: string) => {
    try {
      let msg: string | null;

      switch (str) {
        case 'пом':
        case 'пре':
          msg = await this.getDropOrKeepMsg(str);

          break;
        default:
          msg = await this.getDefaultDiceMsg(str);

          break;
      }

      if (!msg) {
        return Promise.resolve(null);
      }

      return Promise.resolve(msg);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  private getDropOrKeepMsg = (str: string) => {
    try {
      const roll = new DiceRoll(str === 'пре' ? '2d20kh1' : '2d20kl1');
      const resultStr = roll.export();

      if (!resultStr) {
        return Promise.resolve(null);
      }

      const result = JSON.parse(resultStr);
      const { rolls } = result.rolls[0];

      return Promise.resolve(`<b>Результат:</b> ${ String(roll.total) }`
        + `\n<b>Лучший результат:</b> ${
          rolls.find((dice: any) => dice.useInTotal === (str === 'пре')).value }`
        + `\n<b>Худший результат:</b> ${
          rolls.find((dice: any) => dice.useInTotal === (str !== 'пре')).value }`
        + `\n<b>Развернутый результат</b> ${ roll.output }`);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  private getDefaultDiceMsg = (notation: string) => {
    try {
      const roll = new DiceRoll(notation);

      return Promise.resolve(`<b>Результат:</b> ${ String(roll.total) }`
        + `\n<b>Развернутый результат</b> ${ roll.output }`);
    } catch (err) {
      return Promise.reject(err);
    }
  };
}
