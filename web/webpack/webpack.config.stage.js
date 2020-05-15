const merge = require('webpack-merge');
const path = require("path");
const getCommonWebpackConfig = require('./webpack.config.common');
const minimizersConfig = require('./minimizers.config');
const config = require('./config.stage');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');


module.exports = () => {
    return getCommonWebpackConfig(config).then(common => {
        return merge(common, minimizersConfig, {
            devtool: 'source-map',
            mode: "production",
            // plugins: [
            //     new SentryWebpackPlugin({
            //         include: path.resolve(__dirname, '..', 'public'),
            //         ignore: ['node_modules'],
            //         silent: false,
            //         debug: true,
            //     }),
            // ]
        })
    })
}
