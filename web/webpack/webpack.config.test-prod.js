const merge = require('webpack-merge')
const path = require('path')
const getCommonWebpackConfig = require('./webpack.config.common')
const minimizersConfig = require('./minimizers.config')
const config = require('./config.prod')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const simplegit = require('simple-git/promise')

function getCommitHash() {
    const git = simplegit()
    return git.revparse(['HEAD'])
}

module.exports = () => {
    return getCommitHash().then(commithash => {
        return getCommonWebpackConfig(config).then(common => {
            console.log('Setting the release on SentryWebpackPlugin to', commithash)
            return merge(common, {
                devtool: 'source-map',
                mode: 'production',
                plugins: [
                    new SentryWebpackPlugin({
                        include: path.resolve(__dirname, '..', 'public'),
                        ignore: ['node_modules'],
                        silent: false,
                        debug: true,
                    }),
                ],
            })
        })
    })
}