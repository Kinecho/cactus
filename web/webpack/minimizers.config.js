const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const minimizers = [
    new OptimizeCSSAssetsPlugin({sourceMap: true}),
    new TerserPlugin({
        sourceMap: true,
        cache: false,
        parallel: true,
        terserOptions: {
            safari10: true,
        },
    })
]

module.exports = {
    optimization: {
        minimizer: minimizers,
        // splitChunks: {
        //     chunks: 'all'
        // }
    },

};