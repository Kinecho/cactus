<template>
    <div class="main" v-touch:swipe="swipeHandler">
        <p class="big">{{swipeMessage}}</p>
        <transition name="component-fade" mode="out-in">
            <!-- Made this a div vs a template because i needed to set a :key on it for the transition to work -->
            <div v-if="currentIndex === 0" :key="`msg_${currentIndex}`">
                <h1>Here are you results</h1>
                <p>Swipe for more info</p>
            </div>

            <p class="message" v-else-if="currentIndex === 1" :key="`msg_${currentIndex}`">
                Each of the five elements represents a core focus of a balanced life.
            </p>
            <p class="message" v-else-if="currentIndex === 2" :key="`msg_${currentIndex}`">
                The quiz scores each question to analyze each element on a 1 - 5 scale.
            </p>
            <p class="message" v-else-if="currentIndex === 3" :key="`msg_${currentIndex}`">
                The <span class="pink">pink hue</span> represents your commitment to the element.
            </p>
            <p class="message" v-else-if="currentIndex === 4" :key="`msg_${currentIndex}`">
                The <span class="blue">blue hue</span> represents your satisfaction to the element.
            </p>
        </transition>
        <transition name="component-fade" mode="out-in">
            <result-graph :key="currentIndex"
                    :v-touch="swipeHandler"
                    :chart-options="chartOptions"
                    :results="chartData(currentIndex)"
                    :selectable-elements="false"
                    :hide-chart="currentIndex === 1"
                    :hide-elements="currentIndex > 1"
                    :chartId="`chart_${currentIndex}`"/>
        </transition>

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
    import Results from "@components/gapanalysis/Results.vue";
    import Vue2TouchEvents from "vue2-touch-events";

    const logger = new Logger("ResultsOnboarding");
    Vue.use(Vue2TouchEvents)

    @Component({
        components: {
            Results,
            ProgressStepper,
            ResultGraph,
        }
    })
    export default class ResultsOnboarding extends Vue {
        name = "ResultsOnboarding";

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        results!: GapAnalysisAssessmentResult;

        swipeMessage = "Nothing yet";
        currentIndex = 0;

        get chartOptions(): Partial<RadarChartConfig> {
            if (this.currentIndex === 2) {
                return {
                    showLevelLabel: true,
                    maxValue: 5,
                }
            }
            if (this.currentIndex === 3) {
                return {
                    colorValues: DEFAULT_CONFIG().colorValues.slice(0, 1)
                }
            }
            if (this.currentIndex === 4) {
                return {
                    colorValues: DEFAULT_CONFIG().colorValues.slice(1, 2)
                }
            }
            return {};
        }

        chartData(index: number): GapAnalysisAssessmentResult {
            // return this.results;
            let data = this.results.chartData ?? [];

            logger.info("Getting chart data for index", index, data);
            if (index === 2) {
                logger.info("returning empty set");
                return {
                    chartData: [{
                        name: "tmp",
                        axes: [],
                    }]
                }
            }
            if (index === 3) { //only commitment
                return {
                    // chartData: this.results.chartData?.filter(d => d.name !== "Importance")
                    // chartData: data.filter(d => d.name !== "Importance")
                    chartData: [data[0]],
                }
            }

            if (index === 4) { //only commitment
                return {
                    // chartData: data.filter(d => d.name !== "Satisfaction")
                    chartData: [data[1]]
                }
            }

            return this.results;
        }

        get totalPages(): number {
            return 5;
        }

        swipeHandler(direction: any) {
            logger.info("swipe detected:", direction)
            this.swipeMessage = "swiped " + direction;

            if (direction === "left") {
                this.next();
            }

            if (direction === "right") {
                this.previous();
            }
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
    @import "variables";
    @import "transitions";

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

        .message {
            .pink {
                font-weight: bold;
                color: pink;
            }

            .blue {
                font-weight: bold;
                color: blue;
            }
        }
    }

    .big {
        padding: 4rem;
        background-color: lightblue;
    }
</style>