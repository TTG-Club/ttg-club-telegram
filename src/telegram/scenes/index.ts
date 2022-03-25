import SpellScenes from './SpellScenes';
import DiceScenes from './DiceScenes';

const importedScenes = {
    spellScenes: new SpellScenes(),
    diceScenes: new DiceScenes()
}

export default [
    importedScenes.spellScenes.findSpell(),
    importedScenes.diceScenes.diceRoll()
]
