const merge = require('webpack-merge')
const getCommonWebpackConfig = require('./webpack.config.common')
const getDevServerConfig = require('./devserver.config')
const config = require('./config.fe')

module.exports = () => {
    return getCommonWebpackConfig(config).then(common => {
        return merge(common, {
            mode: 'development',
            devtool: 'cheap-module-eval-source-map',
        }, getDevServerConfig(config))
    })
}

