const helpers = require('../helpers')

module.exports = {
    stories: [
        '../src/stories/*.stories.ts',
        '../src/scripts/components/**/*.stories.ts',
    ],
    addons: ['@storybook/addon-actions', '@storybook/addon-links'],
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


        config.resolve.extensions.push('.ts', '.tsx', '.vue', '.scss', '.css')
        config.resolve.modules.push('src', 'styles', 'assets', 'images', 'scripts', 'components', 'vue', 'node_modules')
        config.resolve.alias = {
            'vue$': 'vue/dist/vue.esm.js',
            '@shared': helpers.sharedDir,
            '@web': helpers.scriptDir,
            '@components': helpers.componentsDir,
            '@styles': helpers.stylesDir,
        }

        return config
    },
}
