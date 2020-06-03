import Vue from "vue";
import GapAnalysisLegend from "@components/gapanalysis/GapAnalysisLegend.vue";
import { boolean } from "@storybook/addon-knobs";

export default {
    title: "Charts/Radar"
}

export const Legend = () => Vue.extend({
    template: `
        <div :style="containerStyles">
            <gap-analysis-legend :stacked="stacked"/>
        </div>`,
    components: {
        GapAnalysisLegend,
    },
    props: {
        stacked: {
            default: boolean("Stacked", false)
        }
    },
    computed: {
        containerStyles(): any {
            return {
                border: '3px solid black',
            }
        }
    }
})