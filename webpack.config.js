const path = require("path");
const Dotenv = require('dotenv-webpack')

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development',
  entry: {
    tg: './src/index.ts'
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new Dotenv(),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: ['babel-loader', 'ts-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/')
    },
    modules: ['node_modules'],
    extensions: [
      '.tsx',
      '.ts',
      '.jsx',
      '.js'
    ]
  }
};

