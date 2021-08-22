import { Scenes, session, Telegraf } from 'telegraf';
import BaseActions from './actions/BaseActions';
import SpellActions from './actions/SpellActions';
import scenes from './scenes';
import IBot from '../types/bot';
import DB from '../db';

export default class BotClass {
    static bot: Telegraf<IBot.IContext> = new Telegraf<IBot.IContext>(<string>process.env.TG_TOKEN);

    private baseActions: BaseActions | undefined;

    private spellActions: SpellActions | undefined;

    constructor() {
        DB.connect()
            .then(async () => {
                try {
                    await this.init()
                } catch (err) {
                    console.error(err)
                }
            })
            .catch(err => {
                throw err
            })
    }

    private async init(): Promise<void> {
        try {
            this.registerScenes();
            this.registerActions();

            await this.gracefulStop();

            await BotClass.bot.launch();
        } catch (err) {
            throw new Error(err);
        }
    }

    private registerScenes = (): void => {
        const stage = new Scenes.Stage<IBot.IContext>(scenes, {
            ttl: 10
        });

        BotClass.bot.use(session());
        BotClass.bot.use(stage.middleware());
        BotClass.bot.use((ctx, next) => {
            // eslint-disable-next-line no-param-reassign
            ctx.contextProp ??= '';
            // eslint-disable-next-line no-param-reassign
            ctx.session.sessionProp ??= 0;
            // eslint-disable-next-line no-param-reassign
            ctx.scene.session.sceneSessionProp ??= 0;

            return next()
        })
    }

    private registerActions = (): void => {
        this.baseActions = new BaseActions();
        this.spellActions = new SpellActions();
    }

    private gracefulStop = async (): Promise<void> => {
        try {
            process.once('SIGINT', async () => {
                await BotClass.bot.stop('SIGINT');
            });

            process.once('SIGTERM', async () => {
                await BotClass.bot.stop('SIGTERM');
            });
        } catch (err) {
            throw new Error(err)
        }
    }
}
