import { DiceRoll } from '@dice-roller/rpg-dice-roller';

export default class DiceRollerMiddleware {
  public getDiceMsg = (str: string) => {
    try {
      let msg: string | undefined;

      switch (str) {
        case 'пом':
        case 'пре':
          msg = this.getDropOrKeepMsg(str);

          break;
        default:
          msg = this.getDefaultDiceMsg(str);

          break;
      }

      if (!msg) {
        return '';
      }

      return msg;
    } catch (err) {
      throw new Error(err as string | undefined);
    }
  };

  private getDropOrKeepMsg = (str: string) => {
    try {
      const roll = new DiceRoll(str === 'пре' ? '2d20kh1' : '2d20kl1');
      const resultStr = roll.export();

      if (!resultStr) {
        return '';
      }

      const result = JSON.parse(resultStr);
      const { rolls } = result.rolls[0];

      return `<b>Результат:</b> ${ String(roll.total) }`
        + `\n<b>Лучший результат:</b> ${
          rolls.find((dice: any) => dice.useInTotal === (str === 'пре')).value }`
        + `\n<b>Худший результат:</b> ${
          rolls.find((dice: any) => dice.useInTotal === (str !== 'пре')).value }`
        + `\n<b>Развернутый результат</b> ${ roll.output }`;
    } catch (err) {
      throw new Error(err as string | undefined);
    }
  };

  private getDefaultDiceMsg = (notation: string) => {
    try {
      const roll = new DiceRoll(notation);

      return `<b>Результат:</b> ${ String(roll.total) }`
        + `\n<b>Развернутый результат</b> ${ roll.output }`;
    } catch (err) {
      throw new Error(err as string | undefined);
    }
  };
}
