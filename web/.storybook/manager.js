import {addons} from '@storybook/addons'
// import { themes } from '@storybook/theming';
import {cactusDark} from './cactusTheme'
import './titleAddon'
import {PANEL_ID as knobsPanelId} from '@storybook/addon-knobs'

addons.setConfig({
    panelPosition: 'right',
    theme: cactusDark,
    name: 'Storybook | Cactus',
    // theme: themes.dark,
    selectedPanel: knobsPanelId,
})