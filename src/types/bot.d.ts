import { Context, Scenes } from 'telegraf';

declare namespace IBot {
    interface ISceneSession extends Scenes.SceneSessionData {
        sceneSessionProp: number
    }

    interface ISession extends Scenes.SceneSession<IBot.ISceneSession> {
        sessionProp: number
    }

    interface IContext extends Context {
        contextProp: string
        session: ISession
        scene: Scenes.SceneContextScene<IContext, ISceneSession>
    }

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
