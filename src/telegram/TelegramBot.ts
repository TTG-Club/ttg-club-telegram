import 'dotenv/config';
import {
    session,
    Telegraf,
    Stage
} from 'telegraf';
import _ from 'lodash';
import scenes from './scenes';
import { COMMANDS_LIST } from './constants/Commands';
import actions from './actions';
import IBot from '../../typings/TelegramBot';
import TContext = IBot.TContext;

const { TG_TOKEN } = process.env;

if (!TG_TOKEN || !TG_TOKEN.length) {
    throw new Error('В .env не указана переменная TG_TOKEN');
}

const bot = new Telegraf<TContext>(<string>TG_TOKEN);
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
        throw new Error(err);
    }
}

bot.use(session());
bot.use(stage.middleware());

for (let i = 0; i < actions.length; i++) {
    bot.use(actions[i]);
}

bot.catch((err: string | undefined) => {
    throw new Error(err);
});

bot.launch()
    .then(async () => {
        await launchCallback();
    });

process.once('SIGINT', async () => {
    try {
        await bot.stop();
    } catch (err) {
        throw new Error(err)
    }
});

process.once('SIGTERM', async () => {
    try {
        await bot.stop();
    } catch (err) {
        throw new Error(err)
    }
});
