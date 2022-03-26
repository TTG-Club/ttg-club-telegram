module.exports = {
    apps: [{
        name: 'dnd-tg-bot',
        script: 'dist/telegram/TelegramBot.js',
        watch: 'dist/telegram'
    }]
};
