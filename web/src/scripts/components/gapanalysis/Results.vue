<template>
    <div>
        <div class="analysisResults" :class="{hideChart, hideElements, withLabel, noCacti: !showElementImages}">
            <radar-chart :chart-data="results.chartData"
                    :chart-id="chartId"
                    :options="options" class="chart"
            />
            <result-element
                    element="emotions"
                    class="element emotions"
                    @selected="elementClicked"
                    :pulsing="!selectedElement && selectableElements && pulsingEnabled"
                    :selectable="selectableElements"
                    :selected="selectedElement === 'emotions'"
                    :withLabel="withLabel"
                    :show-image="showElementImages"
            />
            <result-element :pulsing="!selectedElement && selectableElements" :show-image="showElementImages" element="relationships" class="element relationships" @selected="elementClicked" :selected="selectedElement === 'relationships'" :selectable="selectableElements" :withLabel="withLabel"/>
            <result-element :pulsing="!selectedElement && selectableElements" :show-image="showElementImages" element="energy" class="element energy" @selected="elementClicked" :selected="selectedElement === 'energy'" :selectable="selectableElements" :withLabel="withLabel"/>
            <result-element :pulsing="!selectedElement && selectableElements" :show-image="showElementImages" element="meaning" class="element meaning" @selected="elementClicked" :selected="selectedElement === 'meaning'" :selectable="selectableElements" :withLabel="withLabel"/>
            <result-element :pulsing="!selectedElement && selectableElements" :show-image="showElementImages" element="experience" class="element experience" @selected="elementClicked" :selected="selectedElement === 'experience'" :selectable="selectableElements" :withLabel="withLabel"/>
        </div>
        <div v-if="showLegend" class="legend-container">
            <gap-analysis-legend/>
        </div>
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
    import { CactusElement } from "@shared/models/CactusElement";
    import GapAnalysisLegend from "@components/gapanalysis/GapAnalysisLegend.vue";

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
            GapAnalysisLegend,
        }
    })
    export default class Results extends Vue {

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        results!: GapAnalysisAssessmentResult;

        @Prop({ type: Object as () => Partial<RadarChartConfig>, required: false })
        chartOptions?: Partial<RadarChartConfig>

        @Prop({ type: Boolean, required: false, default: true })
        selectableElements!: boolean;

        @Prop({ type: Boolean, required: false, default: true })
        pulsingEnabled!: boolean;

        @Prop({ type: Boolean, required: false, default: false })
        hideChart!: boolean;

        @Prop({ type: Boolean, required: false, default: false })
        hideElements!: boolean;

        @Prop({ type: String, required: false, default: "assessment-1" })
        chartId!: string;

        @Prop({ type: Number, required: false, default: 0 })
        chartPadding!: number;

        @Prop({ type: Boolean, required: false, default: true })
        withLabel!: boolean;

        @Prop({ type: String as () => CactusElement, required: false, default: null })
        selectedElement!: CactusElement | null;

        @Prop({ type: Boolean, required: false, default: true })
        showElementImages!: boolean;

        @Prop({ type: Boolean, required: false, default: true })
        showLegend!: boolean;

        async done() {
            this.$emit('done')
        }

        elementClicked(element: CactusElement | undefined) {
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
        top: 33%;
    }

    .emotions {
        left: 0;
        right: 0;
        top: 0;
    }

    .meaning {
        left: 0;
        top: 33%;
    }

    .experience {
        bottom: 3rem;
        left: 12%;

        .noCacti & {
            left: 0;
        }
    }

    .relationships {
        bottom: 3rem;
        right: 7%;

        .noCacti & {
            right: 0;
        }
    }

    .radar-container {
        padding: 6.4rem 3.2rem 3.2rem;

        .withLabel & {
            padding: 6.4rem;
        }

        .noCacti & {
            padding: .8rem;
        }
    }

</style>
