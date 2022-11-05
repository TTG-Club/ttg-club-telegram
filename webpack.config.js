const path = require("path");
const DotEnv = require('dotenv-webpack');

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
    new DotEnv({
      path: path.resolve(__dirname, '.env'),
      allowEmptyValues: true,
      systemvars: false,
      silent: true,
      defaults: false,
      prefix: 'process.env.'
    })
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

