const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const allPages = require('./../pages')
const helpers = require('./../helpers')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const chalk = require('chalk')
const simplegit = require('simple-git/promise')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const smp = new SpeedMeasurePlugin()

function getCommitHash() {
    const git = simplegit()
    return git.revparse(['HEAD'])
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

module.exports = (config) => {
    return getCommitHash().then((gitcommit) => {
        return new Promise(resolve => {
            const isDev = config.isDev || false
            // noinspection MissingOrObsoleteGoogRequiresInspection
            config.__SENTRY_VERSION__ = process.env.SENTRY_VERSION || gitcommit
            console.log('got git commit hash', gitcommit)

            let parsedConfig = {}

            Object.keys(config).forEach(key => {
                parsedConfig[key] = JSON.stringify(config[key])
            })

            let jsEntries = Object.keys(allPages).reduce((entries, title) => {
                console.log(chalk.yellow('adding entry ', title))
                entries[title] = `${helpers.scriptDir}/pages/${title}.ts`
                return entries
            }, {})

            //add the little dev pages index
            // if (isDev) {
            // jsEntries['pages-index'] = `${helpers.scriptDir}/pages/pages-index.ts`
            // }

            console.log('JS Entries to use', chalk.cyan(JSON.stringify(jsEntries, null, 2)))

            const plugins = [new MiniCssExtractPlugin({
                // filename: isDev ? '[name].css' : '[id].[hash].css',
                // chunkFilename: isDev ? '[id].css' : '[id].[hash].css',
                filename: '[name].css',
                chunkFilename: '[id].css',

            })]

            const cssCacheGroups = {}
            Object.keys(allPages).map(filename => {
                cssCacheGroups[`${filename}Styles`] = {
                    name: filename,
                    // name: false,
                    test: (m, c, entry = filename) => (m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry),
                    chunks: 'all',
                    enforce: true,
                }
            })


            let finalConfig = {
                entry: jsEntries,
                output: {
                    path: helpers.publicDir,
                    // filename: isDev ? '[name].js' : '[name].[hash].js',
                    filename: '[name].js',
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
                optimization: {
                    runtimeChunk: 'single',
                    splitChunks: {
                        // minSize: 0,
                        maxSize: 500000,
                        chunks: 'all',
                        cacheGroups: {
                            ...cssCacheGroups,
                            defaultVendors: {
                                test: /[\\/]node_modules[\\/]/,
                                name: 'vendors',
                                priority: 10,
                                reuseExistingChunk: true,
                            },
                            shared: {
                                test: /[\\/]shared[\\/]/,
                                // minChunks: 2,
                                name: 'shared',
                                chunks: 'all',
                                reuseExistingChunk: true,
                                // priority: -20,
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
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: true,
                                happyPackMode: false,
                                appendTsSuffixTo: [/\.vue$/],
                            },
                        },
                        {
                            test: /\.css$/,
                            use: [
                                // 'style-loader',
                                {
                                    loader: MiniCssExtractPlugin.loader,
                                    options: {
                                        hmr: isDev,
                                    },
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
                                    loader: MiniCssExtractPlugin.loader,
                                    options: {
                                        hmr: isDev,
                                    },
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
                            template: `${helpers.htmlDir}/${filename}.html`,
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
        }).then(config => smp.wrap(config))
    })


}