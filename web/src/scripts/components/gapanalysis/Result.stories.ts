import Vue from "vue";
import ResultsPage from "@components/gapanalysis/Results.vue";
import { boolean, number, text } from "@storybook/addon-knobs";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { RadarChartConfig } from "@web/charts/radarChart";

export default {
    title: "Gap Analysis/Assessment"
}

window._toggleConfetti = () => {
    console.log("not implemented")
};

export const ResultScreen = () => Vue.extend({
    template: `
        <div>
            <results-page :results="results" :chart-options="options" :selectable-elements="elementsSelectable" :chart-padding="chartPadding"/>
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
        },
        chartPadding: {
            default: number("Chart Padding", 100),
        }
    },

    computed: {
        options(): Partial<RadarChartConfig> {
            return {
                showLabels: this.showRadarLabels,
            }
        },
        results(): GapAnalysisAssessmentResult {
            const result = GapAnalysisAssessmentResult.mock();
            result.errorMessage = this.errorMessage;

            return result;
        }
    }
})
