import {
    session,
    Telegraf,
    Stage,
} from 'telegraf';
import _ from 'lodash';
import config from '../.config';
import scenes from './scenes';
import { COMMANDS_LIST } from './constants/Commands';
import actions from './actions';
import IBot from '../../typings/TelegramBot';
import TContext = IBot.TContext;

if (!config.tgToken || !config.tgToken.length) {
    throw new Error('В .env не указана переменная TG_TOKEN');
}

const bot = new Telegraf<TContext>(config.tgToken);
const stage = new Stage(scenes);
const launchCallback = async () => {
    try {
        const defaultCommands = _.cloneDeep(COMMANDS_LIST);
        const modifiedList = Object.values(defaultCommands)
            .map(item => ({
                command: item.command,
                description: item.description
            }));

        await bot.telegram.setMyCommands(modifiedList);
    } catch (err) {
        console.error(err);
    }
}

bot.use(session());
bot.use(stage.middleware());

for (let i = 0; i < actions.length; i++) {
    bot.use(actions[i]);
}

bot.catch(async (err: string | undefined) => {
    if (!!bot?.context?.scene && 'leave' in bot.context.scene) {
        bot.context.scene.leave();
    }

    console.error(err);
});

bot.launch()
    .then(async () => {
        await launchCallback();
    });

process.once('SIGINT', async () => {
    try {
        await bot.stop();
    } catch (err) {
        console.error(err)
    }
});

process.once('SIGTERM', async () => {
    try {
        await bot.stop();
    } catch (err) {
        console.error(err)
    }
});
