import Vue from "vue";
import ResultsOnboarding from "@components/gapanalysis/ResultsOnboarding.vue";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";

export default {
    title: "Gap Analysis/Onboarding"
}


export const ResultsCarousel = () => Vue.extend({
    template: `
        <div>
            <results-onboarding :results="results" />
        </div>`,
    components: {
        ResultsOnboarding,
    },
    data() {
        return {
            results: GapAnalysisAssessmentResult.mock(),
        }
    }
})
