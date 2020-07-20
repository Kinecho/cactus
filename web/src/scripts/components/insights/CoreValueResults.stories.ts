import Vue from "vue"
import CoreValueResults from "@components/insights/CoreValueResults.vue";
import { array } from "@storybook/addon-knobs";
import { CoreValue } from "@shared/models/CoreValueTypes";

export default {
    title: "Insights/Widgets/Core Values"
}

export const HasCoreValues = () => Vue.extend({
    components: {
        CoreValueResults,
    },
    props: {
        coreValues: { type: Array as () => CoreValue[], default: array("Core Values", ["Security", "Altruism"], ",") }
    },
    template: `
        <div>
            <core-value-results :core-values="coreValues"/>
        </div>`
})
