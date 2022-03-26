module.exports = {
    apps: [{
        name: 'dnd-tg-bot',
        script: 'dist/telegram/TelegramBot.js',
        watch: 'dist/telegram',
        exp_backoff_restart_delay: 100
    }]
};
