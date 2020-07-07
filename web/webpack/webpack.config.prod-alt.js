const merge = require('webpack-merge')
const getCommonWebpackConfig = require('./webpack.config.common')
const minimizersConfig = require('./minimizers.config')
const config = require('./config.prod-alt')

const simplegit = require('simple-git/promise')

function getCommitHash() {
    const git = simplegit()
    return git.revparse(['HEAD'])
}

module.exports = () => {
    return getCommitHash().then(commithash => {
        return getCommonWebpackConfig(config).then(common => {
            console.log('Setting the release on SentryWebpackPlugin to', commithash)
            return merge(common, minimizersConfig, {
                devtool: 'source-map',
                mode: 'production',
            })
        })
    })
}