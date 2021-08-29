import { Scenes, session, Telegraf } from 'telegraf';
import BaseActions from './actions/BaseActions';
import SpellActions from './actions/SpellActions';
import scenes from './scenes';
import IBot from '../types/bot';
import DB from '../db';
import DiceActions from './actions/DiceActions';

export default class TelegramBot {
    static bot: Telegraf<IBot.IContext> = new Telegraf<IBot.IContext>(<string>process.env.TG_TOKEN);

    private baseActions: BaseActions | undefined;

    private spellActions: SpellActions | undefined;

    private diceActions: DiceActions | undefined;

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

            await TelegramBot.bot.launch()
                .then(async () => {
                    if (!process.env.DEBUG_MODE || process.env.DEBUG_MODE !== 'true') {
                        await TelegramBot.bot.telegram
                            .sendMessage(<string>process.env.TG_USER_ID, 'Я готов к работе 🙃')
                    }
                });
        } catch (err) {
            throw new Error(err);
        }
    }

    private registerScenes = (): void => {
        const stage = new Scenes.Stage<IBot.IContext>(scenes);

        TelegramBot.bot.use(session());
        TelegramBot.bot.use(stage.middleware());
        TelegramBot.bot.use((ctx, next) => {
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
        this.diceActions = new DiceActions();
    }

    private gracefulStop = async (): Promise<void> => {
        try {
            process.once('SIGINT', async () => {
                await TelegramBot.bot.stop('SIGINT');
            });

            process.once('SIGTERM', async () => {
                await TelegramBot.bot.stop('SIGTERM');
            });
        } catch (err) {
            throw new Error(err)
        }
    }
}

// eslint-disable-next-line no-new
new TelegramBot();
