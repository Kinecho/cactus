const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const helpers = require('./../helpers')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const simpleGit = require('simple-git')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

function getCommitHash() {
    const git = simpleGit()
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
    return getCommitHash().then((commitHash) => {
        return new Promise(resolve => {
            const isDev = config.isDev || false
            config.__SENTRY_VERSION__ = process.env.SENTRY_VERSION || commitHash
            console.log('got git commit hash', commitHash)

            const parsedConfig = Object.keys(config).reduce((cfg, key) => {
                cfg[`process.env.${key}`] = JSON.stringify(config[key])
                return cfg
            }, {})

            let finalConfig = {
                entry: [
                    `${helpers.scriptDir}/main.ts`,
                    `${helpers.scriptDir}/pages/solo_proxy_auth.ts`,
                ],
                output: {
                    path: helpers.publicDir,
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
                optimization: {
                    runtimeChunk: 'single',
                    splitChunks: {
                        minSize: 10000,
                        maxSize: 750000,
                        chunks: 'all',
                        cacheGroups: {
                            styles: {
                                name: 'styles',
                                test: (m, c, entry) => (m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry),
                                chunks: 'all',
                                enforce: true,
                            },
                            defaultVendors: {
                                test: /[\\/]node_modules[\\/]/,
                                name: 'vendors',
                                priority: 10,
                                reuseExistingChunk: true,
                            },
                            vueVendors: {
                                test: /[\\/]node_modules[\\/].*vue.*[\\/]/,
                                name: 'vue',
                                priority: 21,
                                maxSize: 0,
                                reuseExistingChunk: true,
                            },
                            shared: {
                                test: /[\\/]shared[\\/]/,
                                // minChunks: 2,
                                name: 'shared',
                                chunks: 'all',
                                reuseExistingChunk: true,
                                priority: 10,
                            },
                            services: {
                                test: /[\\/]services[\\/]/,
                                // minChunks: 2,
                                name: 'services',
                                chunks: 'all',
                                reuseExistingChunk: true,
                                priority: 10,
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
                                {loader: isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader},
                                {
                                    loader: 'css-loader',
                                    options: {sourceMap: true, url: false},
                                },
                                {loader: 'postcss-loader'},
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
                plugins: [
                    new MiniCssExtractPlugin({
                        filename: isDev ? '[name].css' : '[id].[hash].css',
                        chunkFilename: isDev ? '[id].css' : '[id].[hash].css',

                    }),
                    new HtmlWebpackPlugin({
                        chunks: ['main'],
                        analyticsId: config.__GOOGLE_ANALYTICS_ID__,
                        template: `${helpers.htmlDir}/main.html`,
                        filename: `main.html`,
                        favicon: `${helpers.srcDir}/favicon.ico`,
                        alwaysWriteToDisk: true,
                    }),
                    new HtmlWebpackPlugin({
                        chunks: ['solo_proxy_auth'],
                        analyticsId: config.__GOOGLE_ANALYTICS_ID__,
                        template: `${helpers.htmlDir}/solo_proxy_auth.html`,
                        filename: `solo_proxy_auth.html`,
                        favicon: `${helpers.srcDir}/favicon.ico`,
                        alwaysWriteToDisk: true,
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
            if (!isDev) {
                const smp = new SpeedMeasurePlugin()
                resolve(smp.wrap(finalConfig))
            } else {
                return resolve(finalConfig)
            }
        })
    })
}