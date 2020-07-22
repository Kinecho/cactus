const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const helpers = require('./../helpers')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const chalk = require('chalk')
const simpleGit = require('simple-git')
// const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const config = require('./config.prod')

function getCommitHash() {
    const git = simpleGit()
    return git.revparse(['HEAD'])
}

const allPages = {
    'wordBubbles': {
        'title': 'Embed Pages',
        'path': '/word-bubbles',
        'name': 'word-bubbles',
    },
    // 'embedsRadarChart': {
    //     'title': 'RadarChart',
    //     'path': '/radar-chart',
    //     'name': 'radar-chart',
    // },
}

function recursiveIssuer(m) {
    if (m.issuer) {
        return recursiveIssuer(m.issuer)
    } else if (m.name) {
        return m.name
    } else {
        return false
    }
}

module.exports = () => {
    return getCommitHash().then((gitcommit) => {
        return new Promise(resolve => {
            const isDev = config.isDev || false
            // noinspection MissingOrObsoleteGoogRequiresInspection
            config.__SENTRY_VERSION__ = process.env.SENTRY_VERSION || gitcommit
            console.log('got git commit hash', gitcommit)

            let parsedConfig = {}

            // Object.keys(config).forEach(key => {
            //     parsedConfig[key] = JSON.stringify(config[key])
            // })

            Object.keys(config).forEach(key => {
                parsedConfig[`process.env.${key}`] = JSON.stringify(config[key])
            })

            let jsEntries = Object.keys(allPages).reduce((entries, title) => {
                console.log(chalk.yellow('adding entry ', title))
                entries[title] = `${helpers.scriptDir}/pages/embeds/${title}.ts`
                return entries
            }, {})

            console.log('JS Entries to use', chalk.cyan(JSON.stringify(jsEntries, null, 2)))

            const plugins = [new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[name].css',

            })]

            // const cssCacheGroups = {}
            // Object.keys(allPages).map(filename => {
            //     cssCacheGroups[`${filename}Styles`] = {
            //         name: filename,
            //         // name: false,
            //         test: (m, c, entry = filename) => (m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry),
            //         chunks: 'all',
            //         enforce: true,
            //     }
            // })


            let finalConfig = {
                entry: jsEntries,
                output: {
                    path: helpers.publicDir,
                    filename: '[name].js',
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
                optimization: {
                    runtimeChunk: 'single',
                    splitChunks: {
                        minSize: 10000,
                        chunks: 'all',
                        cacheGroups: {
                            defaultVendors: {
                                test: /[\\/]node_modules[\\/]/,
                                name: 'vendors',
                                priority: 10,
                                reuseExistingChunk: true,
                            },
                            default: {
                                minChunks: 2,
                                priority: -20,
                                reuseExistingChunk: true,
                            },
                        },

                    },
                },
                module: {
                    noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
                    rules: [
                        {
                            test: /\.vue$/,
                            use: [
                                // {
                                //     loader: 'cache-loader',
                                // },
                                {
                                    loader: 'vue-loader',
                                    options: {
                                        compilerOptions: {
                                            whitespace: 'condense',
                                        },
                                    },
                                },
                            ],

                        },
                        {
                            test: /\.ts$/,
                            use: [
                                {
                                    loader: 'cache-loader',
                                },
                                isDev ? null : {
                                    loader: 'thread-loader',
                                },
                                {
                                    loader: 'babel-loader', options: {
                                        cacheDirectory: true,
                                    },
                                },
                                {
                                    loader: 'ts-loader',
                                    options: {
                                        transpileOnly: true,
                                        happyPackMode: !isDev,
                                        appendTsSuffixTo: [/\.vue$/],
                                    },
                                },
                            ].filter(Boolean),

                        },
                        {
                            test: /\.css$/,
                            use: [
                                {
                                    loader: isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
                                },
                                {
                                    loader: 'css-loader',
                                    options: {sourceMap: true, url: false},
                                },
                                {
                                    loader: 'postcss-loader',
                                },
                            ],
                        },
                        {
                            test: /\.(scss)$/,
                            use: [
                                // 'style-loader',
                                {
                                    loader: isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
                                    // options: {
                                    //     hmr: isDev,
                                    // },
                                },
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
                            ].filter(Boolean),
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
                plugins: [...plugins,
                    ...Object.keys(allPages).map(filename => {
                        const page = allPages[filename]

                        const chunks = []
                        chunks.push(filename)

                        console.log(chalk.green('Configuring HTML page ', filename, 'chunks: ', chunks.join(', ')))
                        return new HtmlWebpackPlugin({
                            chunks,
                            title: page.title,
                            template: `${helpers.htmlDir}/embeds.html`,
                            filename: `${filename}.html`,
                            favicon: `${helpers.srcDir}/favicon.ico`,
                            alwaysWriteToDisk: true,
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
            }

            return resolve(finalConfig)
        })
    })
}