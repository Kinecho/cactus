const merge = require("webpack-merge");
const getCommonWebpackConfig = require("./webpack.config.common")
const getDevServerConfig = require("./devserver.config")
const config = require('./config.dev')

config.isDev = true;

module.exports = merge(getCommonWebpackConfig(config), {
    mode: "development",
    devtool: "cheap-module-eval-source-map",
}, getDevServerConfig(config))