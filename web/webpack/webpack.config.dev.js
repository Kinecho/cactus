const merge = require("webpack-merge");
const getCommonWebpackConfig = require("./webpack.config.common")
const devserverConfig = require("./devserver.config")
const config = require('./config.dev')

module.exports = merge(getCommonWebpackConfig(config), {
    mode: "development",
    devtool: "inline-source-map",
}, devserverConfig)