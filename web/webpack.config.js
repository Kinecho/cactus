const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  entry: {
    main: "./src/scripts/index.js",
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: '[name].[chunkhash].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.[contenthash].css',
      chunkFilename: "[id].css"
    }),
    new HtmlWebpackPlugin({
      // inject: false,
      // hash: true,
      template: './src/index.html',
      filename: 'index.html'
    })
  ],
  devServer: {
    open: true
  },
};
