import Vue from "vue";
import JournalHomeEmptyState from "@components/JournalHomeEmptyState.vue";
import { select } from "@storybook/addon-knobs";
import { CactusElement } from "@shared/models/CactusElement";
import AppSettingsService from "@web/services/AppSettingsService";

export default {
    title: "Journal Home/Empty State"
}

export const WithFocusElement = () => Vue.extend({
    template: `
        <div :style="containerStyles" v-if="ready">
            <journal-home-empty-state :focus-element="focusElement"/>
        </div>`,
    components: {
        JournalHomeEmptyState,
    },
    props: {
        focusElement: {
            type: String as () => CactusElement,
            default: select("Element", [CactusElement.energy,
                CactusElement.meaning,
                CactusElement.experience,
                CactusElement.relationships,
                CactusElement.emotions], CactusElement.meaning),
        }
    },
    async beforeMount() {
        await AppSettingsService.sharedInstance.getCurrentSettings();
        this.ready = true;
    },
    data() {
        return {
            ready: false,
        }
    },
    computed: {
        containerStyles(): any {
            return { border: '2px solid blue' }
        }
    }

})

export const NoFocusElement = () => Vue.extend({
    template: `
        <div :style="containerStyles" v-if="ready">
            <journal-home-empty-state/>
        </div>`,
    components: {
        JournalHomeEmptyState,
    },
    props: {},
    async beforeMount() {
        await AppSettingsService.sharedInstance.getCurrentSettings();
        this.ready = true;
    },
    data() {
        return {
            ready: false,
        }
    },
    computed: {
        containerStyles(): any {
            return { border: '2px solid blue' }
        }
    }

})