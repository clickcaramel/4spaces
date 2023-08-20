const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'scripts/main.js'),
  devServer: {
    static: {
      directory: __dirname
    },
    port: 3000,
  },
};