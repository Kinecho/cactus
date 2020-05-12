<template>
    <div class="resultsOnboarding" v-touch:swipe="swipeHandler">
        <h2>Here are your results</h2>
        <!-- Made this a div vs a template because i needed to set a :key on it for the transition to work -->
        <div class="message" v-if="currentIndex === 0" :key="`msg_${currentIndex}`">
            <p>Each of the five elements represents a core focus of a balanced&nbsp;life.</p>
        </div>
        <p class="message" v-else-if="currentIndex === 1" :key="`msg_${currentIndex}`">
            Each question is graded on a scale from&nbsp;1&nbsp;-&nbsp;5.
        </p>
        <div class="message" v-else-if="currentIndex === 2" :key="`msg_${currentIndex}`">
            <p>The <span class="pink">pink hue</span> represents how important the element is to you in your&nbsp;life.</p>
        </div>
        <div class="message" v-else-if="currentIndex === 3" :key="`msg_${currentIndex}`">
            <p>The <span class="blue">blue hue</span> represents how satisfied you are regarding that area of your&nbsp;life.</p>
        </div>
        <result-graph :key="currentIndex"
                :v-touch="swipeHandler"
                :chart-options="chartOptions"
                :results="chartData(currentIndex)"
                :selectable-elements="false"
                :hide-elements="currentIndex > 0"
                :chartId="`chart_${currentIndex}`"/>

        <div class="actions">
            <button aria-label="Previous" @click="previous" class="tertiary icon left no-loading" :disabled="currentIndex < 1">
                <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                </svg>
            </button>
            <progress-stepper type="dots" :total="totalPages" :current="currentIndex"/>
            <button aria-label="Next" @click="next" class="tertiary icon right no-loading" :disabled="currentIndex >= totalPages - 1">
                <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                </svg>
            </button>
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
        transitionName = "component-fade";
        transitionMode = "out-in";

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
            let result = new GapAnalysisAssessmentResult();
            let data = this.results.chartData ?? [];

            logger.info("Getting chart data for index", index, data);
            if (index === 1) {
                logger.info("returning empty set", result);
                return result;
                // return {
                //     chartData: [{
                //         name: "tmp",
                //         axes: [],
                //     }]
                // }
            }
            if (index === 2) { //only commitment
                result.importance = this.results.importance;
                logger.info("results for importance", result);
                return result;
                // return {
                //     // chartData: this.results.chartData?.filter(d => d.name !== "Importance")
                //     // chartData: data.filter(d => d.name !== "Importance")
                //     chartData: [data[0]],
                // }
            }

            if (index === 3) { //only commitment
                result.satisfaction = this.results.satisfaction;
                logger.info("results for satisfaction", result);
                return result;
                // return {
                //     // chartData: data.filter(d => d.name !== "Satisfaction")
                //     chartData: [data[1]]
                // }
            }

            return this.results;
        }

        get totalPages(): number {
            return 4;
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
            this.transitionName = "slide-right";
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
        }

        next() {
            this.transitionName = "slide-left";
            this.currentIndex = Math.min(this.currentIndex + 1, this.totalPages - 1);
        }

    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "transitions";
    @import "mixins";

    .resultsOnboarding {
        padding-bottom: 3.2rem;
        position: relative;
        text-align: center;

        h2 {
            line-height: 1.1;
            margin-bottom: .8rem;
        }

        p {
            font-size: 2rem;
            opacity: .8;
        }
    }

    .swipeMsg {
        @include r(768) {
            display: none;
        }
    }

    .message {
        padding: 0 2.4rem;

        @include r(768) {
            margin: 0 auto;
            max-width: 48rem;
            padding: 0;
        }
    }

    .pink {
        color: $magenta;
        font-weight: bold;
    }

    .blue {
        color: $royal;
        font-weight: bold;
    }

    .actions {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin: 0 auto;
        width: 16rem;
    }

    button.left {
        margin-top: -1px;
        transform: scale(-1);
    }

    .arrow {
        height: 1.8rem;
        width: 1.8rem;
    }

</style>
