const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/js/popup.js', 
    options: './src/pages/Options.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: path.resolve(__dirname, 'src/html/popup.html'), // popup 的 HTML 模板
      chunks: ['popup'], 
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html', 
      template: path.resolve(__dirname, 'src/html/options.html'), 
      chunks: ['options'], 
    }),
  ],
  mode: 'production',
};
