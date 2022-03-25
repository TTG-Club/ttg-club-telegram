import { SceneContext, SceneContextMessageUpdate } from 'telegraf/typings/stage';
import NSpell from './Spell';

declare namespace IBot {
    interface ICommand {
        command: string
        description: string
        fullDescription: string
    }

    interface ICommands {
        [key: string]: ICommand
    }

    interface ISceneSessionStateContext {
        searchStr: string
        spellList: NSpell.ISpell[]
    }

    type ISceneSessionContext = SceneContext['session'] & {
        state: ISceneSessionStateContext
    }

    type ISceneContext = SceneContext<this> & {
        session: ISceneSessionContext
    }

    type TContext = SceneContextMessageUpdate & {
        scene: ISceneContext
    }
}

export default IBot
