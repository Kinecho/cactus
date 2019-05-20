const path = require("path");
const webpack = require("webpack")
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

let projectId = process.env.GCLOUD_PROJECT
let isProd = projectId === "cactus-app-prod"
console.log("isProduction", isProd)
console.log("NODE_ENV", process.env.NODE_ENV)

let minimizers = []
let config = isProd ? require("./config.prod.js") : require("./config.stage.js")

console.log("using config", config)

if (isProd) {
  minimizers.push(new OptimizeCSSAssetsPlugin({sourceMap: true}))
  minimizers.push(new TerserPlugin({
    sourceMap: true,
    terserOptions: {
      safari10: true,
    },
  }),)
}

module.exports = {
  mode: isProd ? "production" : "development",
  optimization: {
    minimizer: minimizers
  },
  entry: {
    main: "./src/scripts/index.js",
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: '[name].[chunkhash].js',
    publicPath: "/"
  },
  devtool: isProd ? 'source-map' : 'inline-source-map',
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
          {
            loader: "css-loader",
            options: {sourceMap: true},
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              // includePaths: path.join(__dirname, 'frontend', 'src', 'index.scss')
            },
          },
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isProd ? 'style.[contenthash].css' : '[name].css',
      chunkFilename: isProd ? "[id].[hash].css" : "[id].css"
    }),
    new HtmlWebpackPlugin({
      // inject: false,
      // hash: true,
      template: './src/index.html',
      filename: 'index.html'
    }),
      new webpack.DefinePlugin(config)
  ],
  devServer: {
    open: true,
    contentBase: path.join(__dirname, "src"),
  },
};
