const merge = require("webpack-merge");
const getCommonWebpackConfig = require("./webpack.config.common")
const minimizersConfig = require("./minimizers.config")
const config = require('./config.prod')


module.exports = merge(getCommonWebpackConfig(config), minimizersConfig, {
    devtool: 'source-map',
    mode: "production"
})