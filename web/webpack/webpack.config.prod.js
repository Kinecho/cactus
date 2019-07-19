const merge = require("webpack-merge");
const getCommonWebpackConfig = require("./webpack.config.common")
const minimizersConfig = require("./minimizers.config")
const config = require('./config.prod')
const SentryWebpackPlugin = require('@sentry/webpack-plugin');


module.exports = merge(getCommonWebpackConfig(config), minimizersConfig, {
    devtool: 'source-map',
    mode: "production",
    plugins: [
        new SentryWebpackPlugin({
            include: './../public',
            // ignoreFile: '.sentrycliignore',
            ignore: ['node_modules']
            // configFile: 'sentry.properties'
        })
    ]
})