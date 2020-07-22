const merge = require('webpack-merge');
const getCommonWebpackConfig = require('./webpack.config.common');
const minimizersConfig = require('./minimizers.config');
const config = require('./config.stage-alt');

module.exports = () => {
    return getCommonWebpackConfig(config).then(common => {
        return merge(common, minimizersConfig, {
            devtool: 'source-map',
            mode: "production",
        })
    })
}
