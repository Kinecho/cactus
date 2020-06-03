import Vue from "vue";
import ResultsProcessing from "@components/gapanalysis/ResultsProcessing.vue";


export default {
    title: "Gap Analysis/Assessment"
}

export const ProcessingResults = () => Vue.extend({
    template: `
        <results-processing/>
    `,
    components: {
        ResultsProcessing
    }
})