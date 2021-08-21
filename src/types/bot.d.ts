import { Scenes } from 'telegraf';

declare namespace IBot {
    interface ISceneSession extends Scenes.SceneSessionData {
        mySceneSessionProp: number
    }

    type ISessionContext = Scenes.SceneContext<IBot.ISceneSession>

    interface ICommand {
        command: string,
        description: string,
        fullDescription: string
    }

    interface ICommands {
        [key: string]: ICommand
    }
}

export default IBot
