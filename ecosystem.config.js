module.exports = {
    apps: [{
        name: 'telegram-bot',
        script: 'dist/telegram-bot.js',
        watch: 'dist/telegram-bot.js'
    }, {
        name: 'discord-bot',
        script: 'dist/discord-bot.js',
        watch: 'dist/discord-bot.js'
    }]
};
