const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const pages = require('webpack/pages')

let projectId = process.env.GCLOUD_PROJECT
let isProd = projectId === 'cactus-app-prod'
console.log('isProduction', isProd)

let minimizers = []
let config = isProd ? require('webpack/config.prod') : require('webpack/config.stage')


Object.keys(config).forEach(key => {
    config[key] = JSON.stringify(config[key])
})

console.log('using config', JSON.stringify(config, null, 2))

if (isProd) {
    minimizers.push(new OptimizeCSSAssetsPlugin({sourceMap: true}))
    minimizers.push(new TerserPlugin({
        sourceMap: true,
        terserOptions: {
            safari10: true,
        },
    }))
}

let jsEntries = Object.keys(pages).reduce((entries, title) => {
    entries[title] = `./src/scripts/pages/${title}.ts`
    return entries
}, {common: './src/scripts/common.ts'})

console.log('jsEntries', jsEntries)

let webpackConfig = {
    mode: isProd ? 'production' : 'development',
    entry: jsEntries,
    output: {
        path: path.resolve(__dirname, 'public'),
        chunkFilename: '[name].js',
        filename: isProd ? '[name].js' : '[name].[chunkhash].js',
    },
    resolve: {
        modules: ['src', 'styles', 'assets', 'images', 'scripts', 'node_modules'],
        alias: {
            '@shared': path.resolve(__dirname, '..', 'shared', 'src'),
            '@web': path.resolve(__dirname, 'src', 'scripts'),
        },
        extensions: ['.js', '.ts', '.tsx', '.jsx', '.scss', '.css', '.svg', '.jpg', '.png', '.html'],
    },
    devtool: isProd ? 'source-map' : 'inline-source-map',
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
            filename: isProd ? 'style.[contenthash].css' : 'style.[name].css',
            chunkFilename: isProd ? '[id].[hash].css' : '[id].css',
            ignoreOrder: true,
        }),
        ...Object.keys(pages).map(title => {
            return new HtmlWebpackPlugin({
                chunks: ['common', title],
                template: `./src/${title}.html`,
                filename: `${title}.html`,
            })
        }),
        new webpack.DefinePlugin(config),
    ],
    devServer: {
        open: false,
        contentBase: path.join(__dirname, 'src'),
        proxy: {
            "/api/**": {
                target: "http://localhost:5000/cactus-app-stage/us-central1",
                pathRewrite: {'^/api' : ''}
            }
        },
        historyApiFallback: {
            disableDotRule: true,
            rewrites: [
                ...Object.keys(pages).filter(page => {
                    return pages[page].path
                }).map(filename => {
                    console.log('adding page', filename)
                    let page = pages[filename]
                    let pattern = new RegExp('^' + page.path + '$')
                    return {from: pattern, to: `/${filename}.html`}
                }),
                {from: /./, to: '/404.html'},
            ],
        },
    },
}

if (isProd) {
    webpackConfig.optimization = {
        minimizer: minimizers,
    }
}

module.exports = webpackConfig