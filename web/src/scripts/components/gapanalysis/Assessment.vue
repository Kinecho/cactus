<template>
    <div>
        <h1>Assessment</h1>
        <div v-if="!finished" class="temp">
            started: {{started}}<br/>
            finished: {{finished}}<br/>
            currentIndex: {{currentQuestionIndex}} <br/>
            questionID: {{(currentQuestion && currentQuestion.id !== undefined) ? currentQuestion.id : 'not set'}}<br/>
            current value: {{currentValue !== undefined ? currentValue : 'not set'}} <br/>
            nextEnabled = {{nextEnabled}}
        </div>

        <template v-if="!started" class="intro">
            <p>Take your gap analysis assessment to find out where you have gaps.</p>
            <button class="btn primary" @click="start">Get Started</button>
        </template>

        <template v-else-if="currentQuestion && !finished && started">
            <question :question="currentQuestion" :current-value="currentValue" @change="setValue"/>
            <div class="actions">
                <button :disabled="!previousEnabled" class="no-loading" @click="previous">Previous</button>
                <button @click="next" :disabled="!nextEnabled" class="no-loading">Next</button>
            </div>
        </template>
        <div v-else-if="finished && result">
            <radar-chart :chart-data="result.chartData" chart-id="assessment-1"/>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import Question from "@components/gapanalysis/Question.vue";
    import GapAnalysisQuestion from "@shared/models/GapAnalysisQuestion";
    import { Prop } from "vue-property-decorator";
    import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
    import Logger from "@shared/Logger";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import RadarChart from "@components/RadarChart.vue";

    const logger = new Logger("gap/Assessment");

    @Component({
        components: {
            RadarChart,
            Question
        }
    })
    export default class Assessment extends Vue {

        @Prop({ type: Object as () => GapAnalysisAssessment, required: false })
        assessment!: GapAnalysisAssessment;
        started: boolean = false;
        finished: boolean = false;
        result: GapAnalysisAssessmentResult | undefined;
        currentQuestionIndex: number = 0;

        /**
         * Responses by questionID
         * @type {{string: number|undefined}}
         */
        responseValues: Record<string, number | undefined> = {};

        get currentQuestion(): GapAnalysisQuestion | null {
            if (!this.started) {
                return null;
            }
            return this.assessment.questionByIndex(this.currentQuestionIndex) ?? null;
        }

        get currentValue(): number | undefined {
            const questionId = this.currentQuestion?.id;
            if (questionId === undefined) {
                return;
            }

            const value = this.responseValues[questionId];
            logger.info(`current question ${ questionId } value is`, value)
            return value;
        }

        setValue(value: number | undefined) {
            const questionId = this.currentQuestion?.id
            logger.info(`set gap value for questionId ${ questionId } to value = `, value);
            if (questionId === undefined) {
                return;
            }

            this.responseValues = { ...this.responseValues, [questionId]: value };
        }

        next() {
            if (this.currentQuestionIndex >= this.assessment.questions.length - 1) {
                this.finishAssessment();
                return
            }
            this.currentQuestionIndex += 1;
        }

        previous() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex = this.currentQuestionIndex - 1;
            }
        }

        get previousEnabled(): boolean {
            return this.currentQuestionIndex != undefined && this.currentQuestionIndex > 0;
        }

        get nextEnabled(): boolean {
            const questionId = this.currentQuestion?.id
            if (questionId === undefined) {
                return false;
            }

            if (this.currentQuestionIndex >= this.assessment.questions.length) {
                return false;
            }

            return this.responseValues[questionId] !== undefined;
        }

        finishAssessment() {
            const result = GapAnalysisAssessmentResult.create({
                assessment: this.assessment,
                responsesByQuestionId: this.responseValues
            })
            logger.info("finishing assessment...", result);
            this.finished = true;
            this.result = result;
        }

        start() {
            this.currentQuestionIndex = 0;
            this.started = true;
        }
    }
</script>

<style scoped lang="scss">
    .temp {
        font-family: monospace;
        border: 1px solid lightgray;
        margin-bottom: 2rem;

    }

    .actions {
        margin: 2rem 0;
    }
</style>