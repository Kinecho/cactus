const merge = require("webpack-merge");
const getCommonWebpackConfig = require("./webpack.config.common")
const getDevServerConfig = require("./devserver.config")
const config = require('./config.fe')

module.exports = merge(getCommonWebpackConfig(config), {
    mode: "development",
    devtool: "inline-source-map",
}, getDevServerConfig(config))