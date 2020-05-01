import Vue from "vue";
import Assessment from "@components/gapanalysis/Assessment.vue";
import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";

export default {
    title: "Gap Analysis/Assessment"
}

export const VersionOne = () => Vue.extend({
    template: `
        <div :style="{margin: '4rem'}">
            <assessment :assessment="assessment"/>
        </div>`,
    components: {
        Assessment,
    },
    data(): { assessment: GapAnalysisAssessment } {
        return {
            assessment: GapAnalysisAssessment.create(),
        }
    }
})