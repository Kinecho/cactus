const helpers = require('../helpers')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const appConfig = require('../webpack/config.stage')
const webpack = require('webpack')
const plugins = [new MiniCssExtractPlugin({
    // filename: isDev ? '[name].css' : '[id].[hash].css',
    // chunkFilename: isDev ? '[id].css' : '[id].[hash].css',
    filename: '[name].css',
    chunkFilename: '[id].css',

})]

module.exports = {
    stories: [
        '../src/stories/*.stories.ts',
        '../src/scripts/components/**/*.stories.ts',
        '../src/scripts/views/**/*.stories.ts',
        '../src/scripts/components/corevalues/**/*.stories.ts',
    ],
    addons: [
        '@storybook/addon-actions',
        '@storybook/addon-links',
        // '@storybook/addon-viewport/register',
        '@storybook/addon-a11y/register',
        '@storybook/addon-storysource',
        '@storybook/addon-knobs',
    ],
    webpackFinal: async config => {
        config.module.rules.push(
        {
            test: /\.(ts|tsx)$/,
            use: [
                {
                    loader: require.resolve('ts-loader'),
                    options: {
                        appendTsSuffixTo: [/\.vue$/],
                    },
                },
            ],
        },
        {
            test: /\.(css|scss)$/,
            use: [
                // {
                //     loader: MiniCssExtractPlugin.loader,
                //     options: {
                //         hmr: true,
                //     },
                // },
                'vue-style-loader',
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
        )

        config.module.rules.push({
            test: /\.stories\.tsx?$/,
            loaders: [
                {
                    loader: require.resolve('@storybook/source-loader'),
                    options: {parser: 'typescript'},
                },
            ],
            enforce: 'pre',
        })

        config.resolve.extensions.push('.ts', '.tsx', '.vue', '.scss', '.css')
        config.resolve.modules.push('src', 'styles', 'assets', 'images', 'scripts', 'components', 'vue', 'node_modules')
        config.resolve.alias = {
            'vue$': 'vue/dist/vue.esm.js',
            '@shared': helpers.sharedDir,
            '@web': helpers.scriptDir,
            '@components': helpers.componentsDir,
            '@styles': helpers.stylesDir,
        }

        // config.plugins.push(...plugins)


        let parsedConfig = {}
        Object.keys(appConfig).forEach(key => {
            parsedConfig[`process.env.${key}`] = JSON.stringify(appConfig[key])
        })

        console.log('parseConfig', JSON.stringify(parsedConfig))
        config.plugins.push(new webpack.DefinePlugin({
            ...parsedConfig,
        }))

        return config
    },
}
