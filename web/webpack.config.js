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



let pages = {
  index: {title: "Home", path: "/", pattern: /^\/$/},
  payment_success: {title: "Success!", path: "/success", pattern: /^\/success$/},
  payment_cancel: {title: "Payment Canceled", path: "/cancel", pattern: /^\/cancel$/},
  "404": {title: "Not Found"},
}

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

let jsEntries = Object.keys(pages).reduce((entries, title) => {
  entries[title] = `./src/scripts/pages/${title}.js`
  return entries
}, {common: "./src/scripts/common.js"})

console.log("jsEntries", jsEntries)

let webpackConfig = {
  mode: isProd ? "production" : "development",
  // entry: {
  //   main: "./src/scripts/index.js",
  // },
  entry: jsEntries,
  output: {
    path: path.resolve(__dirname, "public"),
    chunkFilename: "[name].js",
    filename: isProd ? "[name].js" : '[name].[chunkhash].js',
    // publicPath: ""
  },
  resolve: {
    modules: ["src", "styles", "assets", "images", "scripts", "node_modules"],
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
            options: {sourceMap: true, url: false},
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sourceMapContents: false
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
      ...Object.keys(pages).map(title => {
        return new HtmlWebpackPlugin({
          // inject: false,
          // hash: true,
          chunks: ["common", title],
          template: `./src/${title}.html`,
          filename: `${title}.html`
        })
      }),
      new webpack.DefinePlugin(config)
  ],
  devServer: {
    open: false,
    contentBase: path.join(__dirname, "src"),
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        // { from: /^\/$/, to: '/index.html' },
        // { from: /^\/success/, to: '/payment_success.html' },
        // { from: /^\/cancel/, to: '/payment_cancel.html' },

          ...Object.keys(pages).filter(page => {
            return pages[page].pattern
          }).map(page => {
            // let pattern = "^" + pages[page].path
            console.log("adding page", page)
            return {from: pages[page].pattern, to: `/${page}.html`}
          }),
        { from: /./, to: '/404.html' }
      ]
    }
  },
};

if (isProd) {
  webpackConfig.optimization = {
    minimizer: minimizers
  }
}

console.log(JSON.stringify(webpackConfig, null, 2))

module.exports = webpackConfig