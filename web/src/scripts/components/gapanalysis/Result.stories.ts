import Vue from "vue";
import ResultsPage from "@components/gapanalysis/Results.vue";
import { boolean, number, text } from "@storybook/addon-knobs";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { RadarChartConfig } from "@web/charts/radarChart";
import { CactusElement } from "@shared/models/CactusElement";

export default {
    title: "Gap Analysis/Assessment"
}

window._toggleConfetti = () => {
    console.log("not implemented")
};

export const ResultScreen = () => Vue.extend({
    template: `
        <div>
            <results-page
                    :results="results"
                    :chart-options="options"
                    :selectable-elements="elementsSelectable"
                    :chart-padding="chartPadding"
                    :selected-element="selectedElement"
                    :show-element-images="showElementImages"
                    @elementSelected="elementSelected"
            />
            <h3>Selected Element = {{selectedElement}}</h3>
        </div>
    `,
    components: {
        ResultsPage
    },
    props: {
        errorMessage: {
            default: text("Error Message", ""),
        },
        showElementImages: {
            default: boolean("Show Element Images",true),
        },
        showRadarLabels: {
            default: boolean("Show Radar Labels", false),
        },
        elementsSelectable: {
            default: boolean("Selectable Elements", true),
        },
        chartPadding: {
            default: number("Chart Padding", 10),
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
    },
    data(): { selectedElement: CactusElement | null } {
        return {
            selectedElement: null
        }
    },
    methods: {
        elementSelected(newValue: CactusElement | null | undefined) {
            this.selectedElement = newValue ?? null;
        }
    }
})
