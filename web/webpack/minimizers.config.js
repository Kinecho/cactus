const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const minimizers = [
    new OptimizeCSSAssetsPlugin({sourceMap: true}),
    new TerserPlugin({
        sourceMap: true,
        terserOptions: {
            safari10: true,
        },
    })
]

module.exports = {
    optimization: {
        minimizer: minimizers,
    },

};