import Vue from "vue";
import GapAnalysisLegend from "@components/gapanalysis/GapAnalysisLegend.vue";

export default {
    title: "Charts/Radar"
}

export const Legend = () => Vue.extend({
    template: `
        <div :style="containerStyles">
            <gap-analysis-legend/>
        </div>`,
    components: {
        GapAnalysisLegend,
    },
    props: {},
    computed: {
        containerStyles(): any {
            return {
                border: '3px solid black',
            }
        }
    }
})