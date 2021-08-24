const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const dotenv = require('dotenv')
    .config({ path: `${__dirname}/.env` });
const { EnvironmentPlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: path.resolve(__dirname, 'src', 'discord', 'DiscordBot.ts'),
    output: {
        path: path.resolve(__dirname, 'dist', 'discord-bot'),
        filename: 'discord-bot.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: false,
    module: {
        rules: [
            {
                test: /\.[t|j]s$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
            },
        ],
    },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    externalsPresets: { node: true },
    externals: [
        nodeExternals()
    ],
    performance: {
        hints: process.env.NODE_ENV === 'production' ? 'warning' : false
    },
    target: 'node',
    node: {
        global: true
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            })
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new EnvironmentPlugin({
            ...dotenv.parsed
        }),
        new NodePolyfillPlugin(),
        new NodemonPlugin({
            watch: path.resolve(__dirname, 'dist', 'discord-bot')
        })
    ],
};
