import {create} from '@storybook/theming/create'

export default create({
    base: 'light',

    colorPrimary: '#07454C',
    colorSecondary: '#6590ED',

    // UI
    appBg: 'white',
    appContentBg: '#F1EBE7',
    appBorderColor: '#D6E4E6',
    appBorderRadius: 4,

    // Typography
    fontBase: '"Lato", sans-serif',
    fontCode: 'monospace',

    // Text colors
    textColor: '#07454C',
    textInverseColor: '#FFFFFF',

    // Toolbar default and active colors
    barTextColor: '#B9EFE9',
    barSelectedColor: '#FFFFFF',
    barBg: '#07454C',

    // Form colors
    inputBg: 'white',
    inputBorder: 'silver',
    inputTextColor: 'black',
    inputBorderRadius: 4,

    brandTitle: 'Cactus Storybook',
    brandUrl: 'https://cactus.app',
    brandImage: 'https://cactus.app/assets/images/logo.svg',
})