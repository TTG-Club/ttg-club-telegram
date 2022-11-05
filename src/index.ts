import {
  session, Stage, Telegraf
} from 'telegraf';
import _ from 'lodash';
import scenes from '@/scenes';
import { COMMANDS_LIST } from '@/constants/Commands';
import actions from '@/actions/index';
import type IBot from '@/typings/TelegramBot';

if (!process.env.TG_TOKEN || !process.env.TG_TOKEN.length) {
  throw new Error('В .env не указана переменная TG_TOKEN');
}

const bot = new Telegraf<IBot.TContext>(process.env.TG_TOKEN);
const stage = new Stage(scenes);

const launchCallback = async () => {
  try {
    const defaultCommands: IBot.ICommands = _.cloneDeep(COMMANDS_LIST);

    const modifiedList = Object.values(defaultCommands)
      .map(item => ({
        command: item.command,
        description: item.description
      }));

    await bot.telegram.setMyCommands(modifiedList);
  } catch (err) {
    console.error(err);
  }
};

bot.use(session());
bot.use(stage.middleware());

for (let i = 0; i < actions.length; i++) {
  bot.use(actions[i]);
}

bot.catch(async (err: string | undefined) => {
  if (!!bot?.context?.scene && 'leave' in bot.context.scene) {
    await bot.context.scene.leave();
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
    console.error(err);
  }
});

process.once('SIGTERM', async () => {
  try {
    await bot.stop();
  } catch (err) {
    console.error(err);
  }
});
