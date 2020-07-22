import Vue from "vue";
import JournalHomeEmptyState from "@components/JournalHomeEmptyState.vue";
import { boolean, select } from "@storybook/addon-knobs";
import { CactusElement } from "@shared/models/CactusElement";
import AppSettingsService from "@web/services/AppSettingsService";

export default {
    title: "Empty States/Journal Home"
}

export const WithFocusElement = () => Vue.extend({
    template: `
        <div :style="containerStyles" v-if="ready">
            <empty-state :focus-element="focusElement" :tier="tier"/>
        </div>`,
    components: {
        EmptyState: JournalHomeEmptyState,
    },
    props: {
        tier: {
            default: select("Tier", ["PLUS", "BASIC"], "PLUS")
        },
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
            <empty-state :tier="tier"/>
        </div>`,
    components: {
        EmptyState: JournalHomeEmptyState,
    },
    props: {
        tier: {
            default: select("Tier", ["PLUS", "BASIC"], "PLUS")
        },
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