import Vue from "vue";
import ResultsPage from "@components/gapanalysis/Results.vue";
import { boolean, text } from "@storybook/addon-knobs";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { CactusElement } from "@shared/models/CactusElement";
import { isBlank } from "@shared/util/StringUtil";
import { RadarChartConfig } from "@web/charts/radarChart";

const defaultChartData = GapAnalysisAssessmentResult.mock().chartData;

export default {
    title: "Gap Analysis/Assessment"
}

window._toggleConfetti = () => {
    console.log("not implemented")
};

export const ResultScreen = () => Vue.extend({
    template: `
        <div>
            <results-page :results="results" :chart-options="options" :selectable-elements="elementsSelectable"/>
        </div>
    `,
    components: {
        ResultsPage
    },
    props: {
        errorMessage: {
            default: text("Error Message", ""),
        },
        showRadarLabels: {
            default: boolean("Show Radar Labels", false),
        },
        elementsSelectable: {
            default: boolean("Selectable Elements", true),
        }
    },

    computed: {
        options(): Partial<RadarChartConfig> {
            return {
                showLabels: this.showRadarLabels,
            }
        },
        results(): GapAnalysisAssessmentResult {
            return {
                chartData: defaultChartData,
                errorMessage: isBlank(this.errorMessage) ? undefined : this.errorMessage,
            }
        }
    }
})

