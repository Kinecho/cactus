<template>
    <div class="main">
        <h1>Hello</h1>

        <result-graph :key="currentIndex" :chart-options="chartOptions" :results="chartData(currentIndex)" :hide-chart="currentIndex === 0" :hide-elements="currentIndex > 0" :chartId="`chart_${currentIndex}`"/>
        <div class="actions">
            <button @click="previous" class="no-loading" :disabled="currentIndex < 1">Previous</button>
            <button @click="next" class="no-loading" :disabled="currentIndex >= totalPages - 1">Next</button>
        </div>

        <div class="progress-container">
            <progress-stepper type="dots" :total="totalPages" :current="currentIndex"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ProgressStepper from "@components/ProgressStepper.vue";
    import ResultGraph from "@components/gapanalysis/Results.vue";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import { Prop } from "vue-property-decorator";
    import { DEFAULT_CONFIG, RadarChartConfig } from "@web/charts/radarChart";
    import Logger from "@shared/Logger"

    const logger = new Logger("ResultsOnboarding");


    @Component({
        components: {
            ProgressStepper,
            ResultGraph,
        }
    })
    export default class ResultsOnboarding extends Vue {
        name = "ResultsOnboarding";

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        results!: GapAnalysisAssessmentResult;

        currentIndex = 0;

        get chartOptions(): Partial<RadarChartConfig> {
            if (this.currentIndex === 1) {
                return {
                    showLevelLabel: true,
                    maxValue: 5,
                }
            }
            if (this.currentIndex === 2) {
                return {
                    colorValues: DEFAULT_CONFIG().colorValues.slice(0, 1)
                }
            }
            if (this.currentIndex === 3) {
                return {
                    colorValues: DEFAULT_CONFIG().colorValues.slice(1, 2)
                }
            }
            return {};
        }

        chartData(index: number): GapAnalysisAssessmentResult {
            // return this.results;
            logger.info("Getting chart data for index", index);
            if (index === 1) {
                logger.info("returning empty set");
                return {
                    chartData: [{
                        name: "tmp",
                        axes: [],
                    }]
                }
            }
            if (index === 2) { //only commitment
                return {
                    chartData: this.results.chartData?.filter(d => d.name !== "Importance")
                }
            }

            if (index === 3) { //only commitment
                return {
                    chartData: this.results.chartData?.filter(d => d.name !== "Satisfaction")
                }
            }

            return this.results;
        }

        get totalPages(): number {
            return 5;
        }

        previous() {
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
        }

        next() {
            this.currentIndex = Math.min(this.currentIndex + 1, this.totalPages - 1);
        }

    }
</script>

<style scoped lang="scss">
    .main {
        display: flex;
        flex-direction: column;

        padding: 3rem;

        .progress-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin-top: 3rem;
        }

        .actions {
            display: flex;
            justify-content: center;
        }
    }
</style>