import DiceRollerParser, {
  type DiceExpressionRoll,
  type DieRoll,
  type ExpressionRoll,
  type FateDieRoll,
  type GroupRoll,
  type MathFunctionRoll,
  type RollBase
} from 'dice-roller-parser';
import { orderBy } from 'lodash-es';

import { useHelpers } from './useHelpers.js';

import type { DiceRollResult } from 'dice-roller-parser/dist/rollTypes.js';

export interface IRollResult {
  rendered: string;
  notation: string;
  value: number;
  highest?: number;
  lowest?: number;
}

export class TelegramRollRenderer {
  public render = (roll: RollBase) => this.doRender(roll, true);

  private doRender = (roll: RollBase, root = false) => {
    let render = '';

    const { type } = roll;

    switch (type) {
      case 'diceexpressionroll':
        render = this.renderGroupExpr(roll as DiceExpressionRoll)!;

        break;
      case 'grouproll':
        render = this.renderGroup(roll as GroupRoll);

        break;
      case 'die':
        render = this.renderDie(roll as DiceRollResult);

        break;
      case 'expressionroll':
        render = this.renderExpression(roll as ExpressionRoll);

        break;
      case 'mathfunction':
        render = this.renderFunction(roll as MathFunctionRoll);

        break;
      case 'roll':
        return this.renderRoll(roll as DieRoll);
      case 'fateroll':
        return this.renderFateRoll(roll as FateDieRoll);
      case 'number':
        return `${roll.value}${roll.label ? ` (${roll.label})` : ''}`;
      case 'fate':
        return `F`;
      default:
        throw new Error('Unable to render');
    }

    if (!roll.valid) {
      render = `<s>${render.replace(/<\/?s>/g, '')}</s>`;
    }

    if (root) {
      return this.stripBrackets(render);
    }

    return roll.label ? `(${roll.label}: ${render})` : render;
  };

  private renderGroup = (group: GroupRoll) => {
    const replies: string[] = [];

    for (const die of group.dice) {
      replies.push(this.doRender(die));
    }

    if (replies.length > 1) {
      return `{ ${replies.join(' + ')} } = ${group.value}`;
    }

    const reply = this.stripBrackets(replies[0]!);

    return `{ ${reply} } = ${group.value}`;
  };

  private renderGroupExpr = (group: DiceExpressionRoll) => {
    const replies: string[] = [];

    for (const die of group.dice) {
      replies.push(this.doRender(die));
    }

    return replies.length > 1
      ? `(${replies.join(' + ')} = ${group.value})`
      : replies[0];
  };

  private renderDie = (die: DiceRollResult) => {
    const replies: string[] = [];

    for (const roll of die.rolls) {
      replies.push(this.doRender(roll));
    }

    let reply = `${replies.join(', ')}`;

    if (
      !['number', 'fate'].includes(die.die.type) ||
      die.count.type !== 'number'
    ) {
      reply += `[<b>Rolling: ${this.doRender(die.count)}d${this.doRender(
        die.die
      )}</b>]`;
    }

    const matches = die.matched ? ` Match${die.value === 1 ? '' : 'es'}` : '';

    reply += ` = ${die.value}${matches}`;

    return `(${reply})`;
  };

  private renderExpression = (expr: ExpressionRoll) => {
    if (expr.dice.length > 1) {
      const expressions: string[] = [];

      for (let i = 0; i < expr.dice.length - 1; i++) {
        expressions.push(this.doRender(expr.dice[i]!));
        expressions.push(expr.ops[i]!);
      }

      expressions.push(this.doRender(expr.dice.slice(-1)[0]!));
      expressions.push('=');
      expressions.push(`${expr.value}`);

      return `(${expressions.join(' ')})`;
    }

    if (expr.dice[0]!.type === 'number') {
      return `${expr.value}`;
    }

    return this.doRender(expr.dice[0]!);
  };

  private renderFunction = (roll: MathFunctionRoll) => {
    const render = this.doRender(roll.expr);

    return `(${roll.op}${this.addBrackets(render)} = ${roll.value})`;
  };

  private addBrackets = (render: string) => {
    let updated = render;

    if (!updated.startsWith('(')) {
      updated = `(${updated}`;
    }

    if (!updated.endsWith(')')) {
      updated = `${updated})`;
    }

    return updated;
  };

  private stripBrackets = (render: string) => {
    let updated = render;

    if (updated.startsWith('(')) {
      updated = updated.substring(1);
    }

    if (updated.endsWith(')')) {
      updated = updated.substring(0, updated.length - 1);
    }

    return updated;
  };

  private renderRoll = (roll: DieRoll) => {
    let rollDisplay = `${roll.roll}`;

    if (!roll.valid) {
      rollDisplay = `<s>${roll.roll}</s>`;
    } else if (roll.success && roll.value === 1) {
      rollDisplay = `<i>${roll.roll}</i>`;
    } else if (roll.success && roll.value === -1) {
      rollDisplay = `<b>${roll.roll}</b>`;
    } else if (!roll.success && roll.critical === 'success') {
      rollDisplay = `<i>${roll.roll}</i>`;
    } else if (!roll.success && roll.critical === 'failure') {
      rollDisplay = `<b>${roll.roll}</b>`;
    }

    if (roll.matched) {
      rollDisplay = `<u>${rollDisplay}</u>`;
    }

    return rollDisplay;
  };

  private renderFateRoll = (roll: FateDieRoll) => {
    // eslint-disable-next-line no-nested-ternary
    const rollValue: string = roll.roll === 0 ? '0' : roll.roll > 0 ? '+' : '-';

    let rollDisplay = `${roll.roll}`;

    if (!roll.valid) {
      rollDisplay = `<s>${rollValue}</s>`;
    } else if (roll.success && roll.value === 1) {
      rollDisplay = `<i>${rollValue}</i>`;
    } else if (roll.success && roll.value === -1) {
      rollDisplay = `<b></b>${rollValue}</b>`;
    }

    if (roll.matched) {
      rollDisplay = `<u>${rollDisplay}</u>`;
    }

    return rollDisplay;
  };
}

export function useDiceRoller() {
  const { DiceRoller } = DiceRollerParser;

  const roller = new DiceRoller();
  const { render } = new TelegramRollRenderer();
  const { getEscapedString } = useHelpers();

  const getBaseResponse = (
    rendered: string,
    notation: string,
    value: number
  ) => ({
    rendered,
    notation: getEscapedString(notation),
    value
  });

  const getDropOrKeepMsg = (notation: string): Promise<IRollResult> => {
    try {
      const roll = roller.roll(notation) as DiceRollResult;
      const rendered = render(roll);
      const [highest, lowest] = orderBy(roll.rolls, ['value'], ['desc']);

      return Promise.resolve({
        ...getBaseResponse(rendered, notation, roll.value),
        highest: highest!.value,
        lowest: lowest!.value
      });
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const getDefaultDiceMsg = (notation: string): Promise<IRollResult> => {
    try {
      const roll = roller.roll(notation);
      const rendered = render(roll);

      return Promise.resolve(getBaseResponse(rendered, notation, roll.value));
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const getDiceMsg = (notation: string): Promise<IRollResult> => {
    const formula = notation.replace(/к/g, 'd');

    switch (formula) {
      case '2d20':
      case '2d20kh1':
      case '2d20kl1':
        return getDropOrKeepMsg(formula);

      case 'пом':
        return getDropOrKeepMsg('2d20kl1');

      case 'пре':
        return getDropOrKeepMsg('2d20kh1');

      default:
        return getDefaultDiceMsg(formula);
    }
  };

  const getRenderedMsg = async (notation: string): Promise<string> => {
    try {
      const roll = await getDiceMsg(notation);

      if (!roll) {
        return Promise.reject(
          Error('Somthing went wrong in getRenderedMsg...')
        );
      }

      let reply = '';

      if (roll.highest) {
        reply += `\n<b>Лучший бросок:</b> ${getEscapedString(
          roll.highest.toString()
        )}`;
      }

      if (roll.lowest) {
        reply += `\n<b>Худший бросок:</b> ${getEscapedString(
          roll.lowest.toString()
        )}`;
      }

      reply += `\n\n<b>Развернутый результат:</b> ${roll.rendered}`;

      reply += `\n<b>Результат:</b> ${getEscapedString(roll.value.toString())}`;

      return reply;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  return {
    getDiceMsg,
    getRenderedMsg
  };
}
