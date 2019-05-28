const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const pages = require('./pages')
const helpers = require("./helpers")


let jsEntries = Object.keys(pages).reduce((entries, title) => {
    entries[title] = `${helpers.scriptDir}/pages/${title}.ts`
    return entries
}, {common: `${helpers.scriptDir}/common.ts`})


module.exports = function(config){

    let parsedConfig = {}
    Object.keys(config).forEach(key => {
        parsedConfig[key] = JSON.stringify(config[key])
    })

    return {
        entry: jsEntries,
        output: {
            path: helpers.publicDir,
            chunkFilename: '[name].js',
            filename: '[name].[hash].js',
        },
        resolve: {
            modules: ['src', 'styles', 'assets', 'images', 'scripts', 'node_modules'],
            alias: {
                '@shared': helpers.sharedDir,
                '@web': helpers.scriptDir,
            },
            extensions: ['.js', '.ts', '.tsx', '.jsx', '.scss', '.css', '.svg', '.jpg', '.png', '.html'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    loader: 'awesome-typescript-loader',
                },
                {
                    test: /\.scss$/,
                    use: [
                        'style-loader',
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {sourceMap: true, url: false},
                        },
                        {
                            loader: "postcss-loader"
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                sourceMapContents: false,
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {},
                        },
                    ],
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[id].[hash].css',
                chunkFilename: '[id].[hash].css',
            }),
            ...Object.keys(pages).map(title => {
                return new HtmlWebpackPlugin({
                    chunks: ['common', title],
                    template: `${helpers.srcDir}/${title}.html`,
                    filename: `${title}.html`,
                })
            }),
            new webpack.DefinePlugin(parsedConfig),
        ],
    };
}