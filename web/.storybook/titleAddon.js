import addons from '@storybook/addons'
import {STORY_RENDERED} from '@storybook/core-events'
// import packageJson from 'package.json'


addons.register('TitleAddon', api => {
    api.on(STORY_RENDERED, story => {
        const storyData = api.getCurrentStoryData()
        console.log('setting title for storyData', storyData.name)
        // document.title = `Storybook | Cactus${storyData.name} | ${storyData.kind}  | Cactus`
        document.title = `Cactus Storybook`
    })
})