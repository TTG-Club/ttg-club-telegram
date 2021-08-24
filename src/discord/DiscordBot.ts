import { Client } from 'discord.js';
import DB from '../db';

class DiscordBot {
    static bot: Client = new Client({ intents: [] });

    constructor() {
        DB.connect()
            .then(async () => {
                try {
                    await DiscordBot.init()
                } catch (err) {
                    console.error(err)
                }
            })
            .catch(err => {
                throw err
            })
    }

    private static async init() {
        try {
            await DiscordBot.bot.login(process.env.DISCORD_TOKEN)
        } catch (err) {
            throw new Error(err);
        }
    }
}

// eslint-disable-next-line no-new
new DiscordBot();
