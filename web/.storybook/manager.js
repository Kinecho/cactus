import {addons} from '@storybook/addons'
import { themes } from '@storybook/theming';
//import cactusTheme from './cactusTheme'

addons.setConfig({
    panelPosition: 'right',
    // theme: cactusTheme,
    // theme: dark,
    theme: themes.dark,
})