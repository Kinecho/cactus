import {addons} from '@storybook/addons'
// import { themes } from '@storybook/theming';
import {cactusDark} from './cactusTheme'

addons.setConfig({
    panelPosition: 'right',
    theme: cactusDark,
    // theme: themes.dark,
})