const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const allPages = require('./../pages')
const helpers = require('./../helpers')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const chalk = require('chalk')
const pagesUtil = require('./../pagesUtil')
const simplegit = require('simple-git/promise')

function getCommitHash() {
    const git = simplegit()
    return git.revparse(['HEAD'])
}

module.exports = (config) => {
    return getCommitHash().then((gitcommit) => {
        return new Promise(resolve => {
            const isDev = config.isDev || false
            // noinspection MissingOrObsoleteGoogRequiresInspection
            config.__SENTRY_VERSION__ = process.env.SENTRY_VERSION || gitcommit


            console.log('got git commit hash', gitcommit)

            let pages = pagesUtil.getPages(config, allPages)

            let parsedConfig = {}
            Object.keys(config).forEach(key => {
                parsedConfig[key] = JSON.stringify(config[key])
            })

            let jsEntries = Object.keys(pages).reduce((entries, title) => {
                entries[title] = `${helpers.scriptDir}/pages/${title}.ts`
                return entries
            }, {common: `${helpers.scriptDir}/common.ts`})


            if (isDev) {
                jsEntries['pages-index'] = `${helpers.scriptDir}/pages/pages-index.ts`
            }

            console.log('pages to use', chalk.yellow(JSON.stringify(pages, null, 2)))
            console.log('JS Entries to use', chalk.cyan(JSON.stringify(jsEntries, null, 2)))

            return resolve({
                entry: jsEntries,
                output: {
                    path: helpers.publicDir,
                    // chunkFilename: '[name].js',
                    filename: isDev ? '[name].js' : '[name].[hash].js',
                    publicPath: '/',
                },
                stats: 'errors-warnings',
                resolve: {
                    modules: ['src', 'styles', 'assets', 'images', 'scripts', 'components', 'vue', 'node_modules'],
                    alias: {
                        'vue$': 'vue/dist/vue.esm.js',
                        '@shared': helpers.sharedDir,
                        '@web': helpers.scriptDir,
                        '@components': helpers.componentsDir,
                        '@styles': helpers.stylesDir,
                        'AttrPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/AttrPlugin.js'),
                        'BezierPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/BezierPlugin.js'),
                        'ColorPropsPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/ColorPropsPlugin.js'),
                        'DirectionalRotationPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/DirectionalRotationPlugin.js'),
                        'EaselPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/EaselPlugin.js'),
                        'EndArrayPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/EndArrayPlugin.js'),
                        'ModifiersPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/ModifiersPlugin.js'),
                        'PixiPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/PixiPlugin.js'),
                        'RaphaelPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/RaphaelPlugin.js'),
                        'RoundPropsPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/RoundPropsPlugin.js'),
                        'TextPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/TextPlugin.js'),
                        'ScrollToPlugin': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/plugins/ScrollToPlugin.js'),
                        'TweenLite': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/TweenLite.js'),
                        'TweenMax': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/TweenMax.js'),
                        'TimelineLite': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/TimelineLite.js'),
                        'TimelineMax': path.resolve(helpers.webRoot, 'node_modules', 'gsap/src/uncompressed/TimelineMax.js'),
                        'ScrollMagic': path.resolve(helpers.webRoot, 'node_modules', 'scrollmagic/scrollmagic/uncompressed/ScrollMagic.js'),
                        'animation.gsap': path.resolve(helpers.webRoot, 'node_modules', 'scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap.js'),
                        'debug.addIndicators': path.resolve(helpers.webRoot, 'node_modules', 'scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators.js'),
                    },
                    extensions: ['.js', '.ts', '.tsx', '.jsx', '.scss', '.css', '.svg', '.jpg', '.png', '.html', '.vue'],
                },
                module: {
                    rules: [
                        {
                            test: /\.vue$/,
                            loader: 'vue-loader',
                        },
                        {
                            test: /\.ts$/,
                            loader: 'ts-loader',
                            options: {
                                appendTsSuffixTo: [/\.vue$/],
                            },
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
                                    loader: 'postcss-loader',
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
                        filename: isDev ? '[name].css' : '[id].[hash].css',
                        chunkFilename: isDev ? '[id].css' : '[id].[hash].css',
                    }),
                    ...Object.keys(pages).map(filename => {
                        const page = pages[filename]
                        console.log(chalk.green('Configuring HTML page ', filename))
                        return new HtmlWebpackPlugin({
                            chunks: ['common', filename],
                            title: page.title,
                            template: `${helpers.htmlDir}/${filename}.html`,
                            filename: `${filename}.html`,
                            favicon: `${helpers.srcDir}/favicon.ico`,
                        })
                    }),
                    new webpack.DefinePlugin(parsedConfig),
                    new VueLoaderPlugin(),
                    new WebpackNotifierPlugin({
                        title: 'Webpack',
                        alwaysNotify: true,
                        contentImage: path.join(helpers.webpackDir, 'cactus-square.png'),
                    }),
                ],
            })
        })
    })


}