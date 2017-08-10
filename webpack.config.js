var path = require('path');
var webpack = require('webpack');
var jquery = require("jquery");

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    web_pack_middle: 'webpack-hot-middleware/client',
    home: './src/home_index'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
            $: "jquery",
            jquery: "jquery",
            "windows.jQuery": "jquery"
        })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['react-hot-loader', 'babel-loader'],
      include: path.join(__dirname, 'src')
    },
    {
      test: /\.css$/,
      loaders: ['style-loader', 'css-loader']
    }]
  }
};
