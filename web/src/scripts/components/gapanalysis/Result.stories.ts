import Vue from "vue";
import ResultsPage from "@components/gapanalysis/Results.vue";
import { boolean, object, text } from "@storybook/addon-knobs";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { CactusElement } from "@shared/models/CactusElement";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { isBlank } from "@shared/util/StringUtil";

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

export const ResultScreen = () => Vue.extend({
    template: `
        <div>
            <results-page :show-confetti="showConfetti" :results="results"/>
            <div :style="{font: 'monospace'}">
                <hr/>
                <button @click="toggleConfetti">Show Confetti</button>
            </div>
        </div>
    `,
    components: {
        ResultsPage
    },
    props: {
        errorMessage: {
            default: text("Error Message", ""),
        },
        chartData: {
            type: Array as () => RadarChartData[],
            default: object("Chart Data", defaultChartData)
        }
    },
    data(): { showConfetti: boolean } {
        return {
            showConfetti: true,
        }
    }, methods: {
        toggleConfetti() {
            this.showConfetti = false;
            setTimeout(() => {
                this.showConfetti = true;
            }, 50)
        }
    },
    computed: {
        results(): GapAnalysisAssessmentResult {
            return {
                chartData: this.chartData,
                errorMessage: isBlank(this.errorMessage) ? undefined : this.errorMessage,
            }
        }
    }
})