import Vue from "vue";
import Assessment from "@components/gapanalysis/Assessment.vue";
import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";

export default {
    title: "Gap Analysis/Assessment"
}

export const VersionOne = () => Vue.extend({
    template: `
        <assessment :assessment="assessment"/>`,
    components: {
        Assessment,
    },
    data(): { assessment: GapAnalysisAssessment } {
        return {
            assessment: GapAnalysisAssessment.create(),
        }
    }
})