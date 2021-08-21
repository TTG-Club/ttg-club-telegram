module.exports = {
    apps: [{
        name: 'dnd-tg-bot',
        script: 'dist/bot.js',
        watch: 'dist/bot.js'
    }, {
        name: 'dnd-server',
        script: 'dist/server.js',
        watch: 'dist/server.js'
    }]
};
