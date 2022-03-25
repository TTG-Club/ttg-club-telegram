import BaseActions from './BaseActions';
import SpellActions from './SpellActions';
import DiceActions from './DiceActions';

const actions = [
    new BaseActions().registerCommands(),
    new SpellActions().registerCommands(),
    new DiceActions().registerCommands()
];

export default actions
