const helpers = require('./../helpers')
const HTMLWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')

module.exports = function (config) {
    return {
        devServer: {
            open: false,
            contentBase: helpers.srcDir,
            stats: 'errors-warnings',
            hot: true,
            https: config.https || false,
            historyApiFallback: {
                disableDotRule: true,
                rewrites: [
                    {from: /\/solo-proxy-auth/, to: '/solo_proxy_auth.html'},
                    {from: /./, to: '/main.html'},
                ],
            },
        },
        plugins: [
            new HTMLWebpackHarddiskPlugin({
                outputPath: helpers.publicDir,
            }),
        ],
    }
}
