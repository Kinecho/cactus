<template>
    <div class="analysisResults" :class="{hideChart, hideElements}">
        <radar-chart :chart-data="results.chartData" :chart-id="chartId" :options="options" class="chart"/>
        <result-element
                element="emotions"
                class="element emotions"
                @selected="elementClicked"
                :selectable="selectableElements"
                :selected="selectedElement === 'emotions'"
        />
        <result-element element="relationships" class="element relationships" @selected="elementClicked" :selected="selectedElement === 'relationships'" :selectable="selectableElements"/>
        <result-element element="energy" class="element energy" @selected="elementClicked" :selected="selectedElement === 'energy'" :selectable="selectableElements"/>
        <result-element element="meaning" class="element meaning" @selected="elementClicked" :selected="selectedElement === 'meaning'" :selectable="selectableElements"/>
        <result-element element="experience" class="element experience" @selected="elementClicked" :selected="selectedElement === 'experience'" :selectable="selectableElements"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusConfetti from "@components/CactusConfetti.vue";
    import Component from "vue-class-component";
    import RadarChart from "@components/RadarChart.vue";
    import { Prop } from "vue-property-decorator";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import ResultElement from "@components/gapanalysis/ResultElement.vue";
    import { RadarChartConfig } from "@web/charts/radarChart";

    /**
     * Render the results of a Gap analysis assessment.
     * This component is only responsible for rendering the chart and the CactusElement views,
     * which can be selectable or not.
     *
     * This component should not contain any "continue" or "done" or "next" buttons.
     * Those should be provided by the parent, around this component.
     */
    @Component({
        components: {
            ResultElement,
            CactusConfetti,
            RadarChart,
        }
    })
    export default class Results extends Vue {

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        results!: GapAnalysisAssessmentResult;

        @Prop({ type: Object as () => Partial<RadarChartConfig>, required: false })
        chartOptions?: Partial<RadarChartConfig>

        @Prop({ type: Boolean, required: false, default: true })
        selectableElements!: boolean;

        @Prop({ type: Boolean, required: false, default: false })
        hideChart!: boolean;

        @Prop({ type: Boolean, required: false, default: false })
        hideElements!: boolean;

        @Prop({ type: String, required: false, default: "assessment-1" })
        chartId!: string;

        selectedElement: ResultElement | string | null = null;

        async done() {
            this.$emit('done')
        }

        elementClicked(element: ResultElement | undefined) {
            if (this.selectedElement === element) {
                this.selectedElement = null;
            }
            this.selectedElement = element ?? null;
            this.$emit('elementSelected', element);
        }

        get options(): Partial<RadarChartConfig> {
            return {
                margin: {
                    top: 10,
                    left: 10,
                    right: 10,
                    bottom: 10,
                },
                legend: false,

                ...this.chartOptions
            }
        }
    }
</script>

<style scoped lang="scss">
    .chart {
        opacity: 1;
    }

    .hideChart .chart,
    .hideElements .element {
        opacity: 0;
    }

    .analysisResults {
        display: grid;
        grid-template-areas:
            ". . energy . ."
            "emotions emotions . meaning meaning"
            "experience experience . relationships relationships";
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        margin: 0 auto;
        padding: 70px 0 20px; /*offset elements*/
        width: 22rem;

        &.hideElements {
            padding: 0;
        }
    }

    .energy {
        grid-area: energy;
        transform: translateY(-70px)
    }
    .emotions {
        grid-area: emotions;
        transform: translate(-50px, -30px);
    }
    .meaning {
        grid-area: meaning;
        transform: translate(50px, -30px);
    }
    .experience {
        grid-area: experience;
        transform: translate(-20px, 20px);
    }
    .relationships {
        grid-area: relationships;
        transform: translate(20px, 20px);
    }
    .radar-container {
        grid-area: 1 / 1 / 4 / 6;
    }

</style>
