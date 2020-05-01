import Vue from "vue";
import ResultsPage from "@components/gapanalysis/Results.vue";
import { boolean, object, text, withKnobs, button } from "@storybook/addon-knobs";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { CactusElement } from "@shared/models/CactusElement";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { isBlank } from "@shared/util/StringUtil";
import { addDecorator } from "@storybook/vue";

const defaultChartData = [{
    name: "Importance",
    axes:
    [
        { value: 2, axis: CactusElement.emotions },
        { value: 3, axis: CactusElement.energy },
        { value: 4, axis: CactusElement.experience },
        { value: 4, axis: CactusElement.meaning },
        { value: 4, axis: CactusElement.relationships },
    ]
}, {
    name: "Satisfaction",
    axes: [
        { value: 5, axis: CactusElement.emotions },
        { value: 3, axis: CactusElement.energy },
        { value: 3, axis: CactusElement.experience },
        { value: 1, axis: CactusElement.meaning },
        { value: 4, axis: CactusElement.relationships },
    ]
}]

export default {
    title: "Gap Analysis/Assessment"
}

window._toggleConfetti = () => {
    console.log("not implemented")
};

export const ResultScreen = () => Vue.extend({
    template: `
        <div>
            <results-page :show-confetti="showConfetti" :results="results"/>
        </div>
    `,
    components: {
        ResultsPage
    },
    props: {
        showConfetti: {
            default: boolean("Show Confetti (toggle to show again)", true)
        },
        errorMessage: {
            default: text("Error Message", ""),
        },
    },

    computed: {
        results(): GapAnalysisAssessmentResult {
            return {
                chartData: defaultChartData,
                errorMessage: isBlank(this.errorMessage) ? undefined : this.errorMessage,
            }
        }
    }
})

