import Vue from "vue";
import ResultElement from "@components/gapanalysis/ResultElement.vue";
import { CactusElement } from "@shared/models/CactusElement";
import { boolean, select } from "@storybook/addon-knobs";

export default {
    title: "Gap Analysis/Result Element"
}

export const Default = () => Vue.extend({
    template: `
        <div :style="{padding: '1rem'}">
            <result-element :element="element"
                    :selectable="selectable"
                    @selected="onSelected"
                    :selected="selected"
                    :with-label="showLabel"/>
            <pre>is Selected = {{selected}}</pre>
        </div>`,

    components: {
        ResultElement,
    },
    props: {
        selectable: {
            default: boolean("Selectable", true),
        },
        showLabel: {
            default: boolean("Show Label", true),
        },
        element: {
            type: String as () => CactusElement,
            default: select("Element", [CactusElement.energy,
                CactusElement.meaning,
                CactusElement.experience,
                CactusElement.relationships,
                CactusElement.emotions], CactusElement.meaning),
        },
    },
    data(): { selectedElement: CactusElement | undefined } {
        return {
            selectedElement: undefined,
        }
    },
    methods: {
        onSelected(selected: CactusElement | undefined) {
            this.selectedElement = selected;
        }
    },
    computed: {
        selected(): boolean {
            return this.element === this.selectedElement;
        }
    }
})

export const WithCircle = () => Vue.extend({
    template: `
        <div :style="{padding: '1rem'}">
            <result-element :element="element"
                    :selectable="selectable"
                    @selected="onSelected"
                    :selected="selected"
                    :with-circle="showCircle"
                    :with-label="showLabel"/>
            <pre>is Selected = {{selected}}</pre>
        </div>`,

    components: {
        ResultElement,
    },
    props: {
        selectable: {
            default: boolean("Selectable", true),
        },
        showLabel: {
            default: boolean("Show Label", true),
        },
        showCircle: {
            default: boolean("Show Circle", true),
        },
        element: {
            type: String as () => CactusElement,
            default: select("Element", [CactusElement.energy,
                CactusElement.meaning,
                CactusElement.experience,
                CactusElement.relationships,
                CactusElement.emotions], CactusElement.meaning),
        },
    },
    data(): { selectedElement: CactusElement | undefined } {
        return {
            selectedElement: undefined,
        }
    },
    methods: {
        onSelected(selected: CactusElement | undefined) {
            this.selectedElement = selected;
        }
    },
    computed: {
        selected(): boolean {
            return this.element === this.selectedElement;
        }
    }
})
