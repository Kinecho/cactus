<template>
    <div class="analysisResults" :class="{hideChart, hideElements}">
        <radar-chart :chart-data="results.chartData"
                :chart-id="chartId"
                :options="options" class="chart"
        />
        <result-element
                element="emotions"
                class="element emotions"
                @selected="elementClicked"
                :selectable="selectableElements"
                :selected="selectedElement === 'emotions'"
                :withLabel="withLabel"
        />
        <result-element element="relationships" class="element relationships" @selected="elementClicked" :selected="selectedElement === 'relationships'" :selectable="selectableElements" :withLabel="withLabel"/>
        <result-element element="energy" class="element energy" @selected="elementClicked" :selected="selectedElement === 'energy'" :selectable="selectableElements" :withLabel="withLabel"/>
        <result-element element="meaning" class="element meaning" @selected="elementClicked" :selected="selectedElement === 'meaning'" :selectable="selectableElements" :withLabel="withLabel"/>
        <result-element element="experience" class="element experience" @selected="elementClicked" :selected="selectedElement === 'experience'" :selectable="selectableElements" :withLabel="withLabel"/>
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
    import Logger from "@shared/Logger"

    const logger = new Logger("Results");


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

        @Prop({ type: Number, required: false, default: 0 })
        chartPadding!: number;

        @Prop({type: Boolean, required: false, default: true})
        withLabel!: boolean;

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
                    top: this.chartPadding,
                    left: this.chartPadding,
                    right: this.chartPadding,
                    bottom: this.chartPadding,
                },
                legend: false,
                ...this.chartOptions
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .chart {
        opacity: 1;
        text-align: center;
    }

    .hideChart .chart,
    .hideElements .element {
        opacity: 0;
    }

    .analysisResults {
        position: relative;
    }

    .element {
        position: absolute;
    }

    .energy {
        right: 0;
        top: 6rem;
    }

    .emotions {
        left: 0;
        right: 0;
        top: 0;
    }

    .meaning {
        left: 0;
        top: 6rem;
    }

    .experience {
        bottom: 0;
        left: 2rem;
    }

    .relationships {
        bottom: 0;
        right: 2rem;
    }

    .radar-container {
        padding: 6.4rem 6.4rem 3.2rem;
    }

</style>
