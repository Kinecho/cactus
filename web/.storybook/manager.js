import {addons} from '@storybook/addons'
// import { themes } from '@storybook/theming';
import {cactusDark} from './cactusTheme'
import './titleAddon'

addons.setConfig({
    panelPosition: 'right',
    theme: cactusDark,
    name: 'Storybook | Cactus',
    // theme: themes.dark,
})