import _ from 'lodash';
import { Telegraf } from 'telegraf';
import Commands from '../constants/Commands';
import BotClass from '../BotClass';
import IBot from '../../types/bot';
import SpellScenes from '../scenes/SpellScenes';

export default class BaseActions {
    private readonly bot: Telegraf<IBot.IContext>;

    constructor() {
        this.bot = BotClass.bot;

        this.registerBaseCommands()
            .then();
    }

    private async registerBaseCommands() {
        try {
            this.onStart();
            this.onHelp();
            this.onActions();
            await this.setCommandList();
        } catch (err) {
            throw new Error(err);
        }
    }

    private onStart() {
        this.bot.start(async ctx => {
            try {
                await ctx.reply('Приветствую, искатель приключений! 👋🏻')
            } catch (err) {
                throw new Error(err)
            }
        })
    }

    private onHelp() {
        this.bot.help(async ctx => {
            try {
                const registeredCommands = await this.bot.telegram.getMyCommands();
                const commandsExist = !!registeredCommands
                    && Array.isArray(registeredCommands)
                    && !!registeredCommands.length;

                if (!commandsExist) {
                    await ctx.reply('Список команд пока недоступен... скорее всего произошла какая-то ошибка');

                    return;
                }

                let msg = '<b>Список доступных команд:</b>';

                registeredCommands.forEach((cmd, index) => {
                    msg += `${index === 0 ? '\n' : ''}\n${Commands.COMMANDS_LIST[cmd.command].fullDescription}`;
                });

                msg += `\n\n<b>Источник заклинаний:</b> ${ SpellScenes.BASE_URL }`

                await ctx.replyWithHTML(msg);
            } catch (err) {
                throw new Error(err);
            }
        })
    }

    private onActions() {
        this.bot.action(new RegExp('.*'), async (ctx, next) => {
            await ctx.answerCbQuery();

            await next();
        });
    }

    private async setCommandList() {
        try {
            const defaultCommands = _.cloneDeep(Commands.COMMANDS_LIST);
            const modifiedList = Object.values(defaultCommands).map(item => ({
                command: item.command,
                description: item.description
            }));

            await this.bot.telegram.setMyCommands(modifiedList);
        } catch (err) {
            throw new Error(err);
        }
    }
}
