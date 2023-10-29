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

import type { DiceRollResult } from 'dice-roller-parser/dist/rollTypes.js';

export interface IRollResult {
  rendered: string;
  notation: string;
  value: number;
  highest?: number;
  lowest?: number;
}

export class TelegramRollRenderer {
  render = (roll: RollBase) => this.doRender(roll, true);

  private doRender = (roll: RollBase, root = false) => {
    let render = '';
    let label = '';

    const { type } = roll;

    switch (type) {
      case 'diceexpressionroll':
        // @ts-ignore
        render = this.renderGroupExpr(roll as DiceExpressionRoll);

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
        label = roll.label ? ` \\(${roll.label}\\)` : '';

        return `${roll.value}${label}`;
      case 'fate':
        return `F`;
      default:
        throw new Error('Unable to render');
    }

    if (!roll.valid) {
      render = `~${render.replace(/~/g, '')}~`;
    }

    if (root) {
      return this.stripBrackets(render);
    }

    return roll.label ? `\\(${roll.label}\\: ${render}\\)` : render;
  };

  private renderGroup = (group: GroupRoll) => {
    const replies: string[] = [];

    for (const die of group.dice) {
      replies.push(this.doRender(die));
    }

    if (replies.length > 1) {
      return `{ ${replies.join(' \\+ ')} } \\= \\${group.value}`;
    }

    // @ts-ignore
    const reply = this.stripBrackets(replies[0]);

    return `\\{ ${reply} \\} \\= \\${group.value}`;
  };

  private renderGroupExpr = (group: DiceExpressionRoll) => {
    const replies: string[] = [];

    for (const die of group.dice) {
      replies.push(this.doRender(die));
    }

    return replies.length > 1
      ? `\\(${replies.join(' \\+ ')} \\= \\${group.value}\\)`
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
      reply += `\\[*Rolling\\: ${this.doRender(die.count)}d${this.doRender(
        die.die
      )}*\\]`;
    }

    const matches = die.matched ? ` Match${die.value === 1 ? '' : 'es'}` : '';

    reply += ` \\= \\${die.value}${matches}`;

    return `\\(${reply}\\)`;
  };

  private renderExpression = (expr: ExpressionRoll) => {
    if (expr.dice.length > 1) {
      const expressions: string[] = [];

      for (let i = 0; i < expr.dice.length - 1; i++) {
        // @ts-ignore
        expressions.push(this.doRender(expr.dice[i]));
        // @ts-ignore
        expressions.push(`\\${expr.ops[i]}`);
      }

      // @ts-ignore
      expressions.push(this.doRender(expr.dice.slice(-1)[0]));
      expressions.push('\\=');
      expressions.push(`\\${expr.value}`);

      return `\\(${expressions.join(' ')}\\)`;
    }

    // @ts-ignore
    if (expr.dice[0].type === 'number') {
      return `\\${expr.value}`;
    }

    // @ts-ignore
    return this.doRender(expr.dice[0]);
  };

  private renderFunction = (roll: MathFunctionRoll) => {
    const render = this.doRender(roll.expr);

    return `\\(${roll.op}${this.addBrackets(render)} \\= \\${roll.value}\\)`;
  };

  private addBrackets = (render: string) => {
    let newRender = render;

    if (!newRender.startsWith('(')) {
      newRender = `\\(${newRender}`;
    }

    if (!newRender.endsWith(')')) {
      newRender = `${newRender}\\)`;
    }

    return newRender;
  };

  private stripBrackets = (render: string) => {
    let newRender = render;

    if (newRender.startsWith('(')) {
      newRender = newRender.substring(1);
    }

    if (newRender.endsWith(')')) {
      newRender = render.substring(0, newRender.length - 1);
    }

    return newRender;
  };

  private renderRoll = (roll: DieRoll) => {
    let rollDisplay = `\\${roll.roll}`;

    if (!roll.valid) {
      rollDisplay = `~${roll.roll}~`;
    } else if (roll.success && roll.value === 1) {
      rollDisplay = `*${roll.roll}*`;
    } else if (roll.success && roll.value === -1) {
      rollDisplay = `_${roll.roll}_`;
    } else if (!roll.success && roll.critical === 'success') {
      rollDisplay = `*${roll.roll}*`;
    } else if (!roll.success && roll.critical === 'failure') {
      rollDisplay = `_${roll.roll}_`;
    }

    if (roll.matched) {
      rollDisplay = `__${rollDisplay}__`;
    }

    return rollDisplay;
  };

  private renderFateRoll = (roll: FateDieRoll) => {
    const rollValue: string =
      roll.roll === 0 ? '0' : roll.roll > 0 ? '\\+' : '\\-';

    let rollDisplay = `\\${roll.roll}`;

    if (!roll.valid) {
      rollDisplay = `~${rollValue}~`;
    } else if (roll.success && roll.value === 1) {
      rollDisplay = `*${rollValue}*`;
    } else if (roll.success && roll.value === -1) {
      rollDisplay = `_${rollValue}_`;
    }

    if (roll.matched) {
      rollDisplay = `__${rollDisplay}__`;
    }

    return rollDisplay;
  };
}

export function useDiceRoller() {
  const { DiceRoller } = DiceRollerParser;

  const roller = new DiceRoller();
  const { render } = new TelegramRollRenderer();

  const getEscapedString = (str: string) =>
    str.replace(/([_*[\]()~`>#+\-=|{},.!])/g, '\\$1');

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

      let reply = `\n\n*Развернутый результат:* ${roll.rendered}`;

      if (notation !== '2d20' && notation !== '2к20') {
        reply += `\n\n*Результат:* ${getEscapedString(roll.value.toString())}`;
      }

      if (roll.highest) {
        reply += `\n\n*Лучший бросок:* ${getEscapedString(
          roll.highest.toString()
        )}`;
      }

      if (roll.lowest) {
        reply += `\n\n*Худший бросок:* ${getEscapedString(
          roll.lowest.toString()
        )}`;
      }

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
