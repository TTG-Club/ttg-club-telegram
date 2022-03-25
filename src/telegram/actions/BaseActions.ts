import _ from 'lodash';
import {
    Composer,
    Markup
} from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import { COMMANDS_LIST } from '../constants/Commands';
import IBot from '../../../typings/TelegramBot';
import TContext = IBot.TContext;

export default class BaseActions {
    private bot = new Composer<TContext>();

    public registerCommands() {
        this.onStart();
        this.onHelp();
        this.onActions();

        return this.bot;
    }

    private onStart() {
        this.bot.start(async ctx => {
            try {
                await ctx.reply('Приветствую, искатель приключений! 👋🏻', {
                    reply_markup: Markup.inlineKeyboard(
                        [[
                            Markup.callbackButton('Список команд', 'baseHelp')
                        ]]
                    )
                })
            } catch (err) {
                throw new Error(err)
            }
        })
    }

    private onHelp() {
        const helpResponse = async (ctx: TelegrafContext) => {
            try {
                const defaultCommands = _.cloneDeep(COMMANDS_LIST);
                const modifiedList = Object.values(defaultCommands).map(item => (
                    `${ COMMANDS_LIST[item.command].fullDescription }`
                ))

                let msg = '<b>Список доступных команд:</b>\n';

                modifiedList.forEach((cmd: string) => {
                    msg += `\n${cmd}`;
                });

                await ctx.replyWithHTML(msg);
            } catch (err) {
                throw new Error(err);
            }
        }

        this.bot.action('baseHelp', async ctx => helpResponse(ctx));

        this.bot.help(async ctx => helpResponse(ctx));
    }

    private onActions() {
        this.bot.action(/.*/, async (ctx, next) => {
            await ctx.answerCbQuery();

            await next();
        });
    }
}
