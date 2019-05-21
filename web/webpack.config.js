const path = require("path");
const webpack = require("webpack")
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

let projectId = process.env.GCLOUD_PROJECT
let isProd = projectId === "cactus-app-prod"
console.log("isProduction", isProd)
// console.log("NODE_ENV", process.env.NODE_ENV)

let minimizers = []
let config = isProd ? require("./config.prod.js") : require("./config.stage.js")


Object.keys(config).forEach(key => {
  config[key] = JSON.stringify(config[key])
})

console.log("using config", JSON.stringify(config, null, 2))

if (isProd) {
  minimizers.push(new OptimizeCSSAssetsPlugin({sourceMap: true}))
  minimizers.push(new TerserPlugin({
    sourceMap: true,
    terserOptions: {
      safari10: true,
    },
  }))
}



let webpackConfig = {
  mode: isProd ? "production" : "development",
  entry: {
    main: "./src/scripts/index.js",
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: isProd ? "[name].js" : '[name].[chunkhash].js',
    // publicPath: ""
  },
  resolve: {
    modules: [ "styles", "assets", "images", "scripts", "node_modules"],
    alias: {
      // Component: 'app/components/Component.jsx',
    },
    extensions: ['.js', '.jsx', ".scss", ".css", ".svg", ".jpg", ".png", ".html"],
  },
  // devtool: isProd ? 'source-map' : 'inline-source-map',
  devtool: "inline-source-map",

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
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isProd ? 'style.[contenthash].css' : 'style.[name].css',
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

if (isProd) {
  webpackConfig.optimization = {
    minimizer: minimizers
  }
}

console.log(JSON.stringify(webpackConfig, null, 2))

module.exports = webpackConfig