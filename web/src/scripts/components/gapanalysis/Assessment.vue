<template>
    <div>
        <h1>Assessment</h1>
        <div>
            started: {{started}}<br/>
            currentIndex: {{currentQuestionIndex}} <br/>
            questionID: {{(currentQuestion && currentQuestion.id) !== undefined ? currentQuestion.id : 'not set'}}<br/>
            current value: {{currentValue !== undefined ? currentValue : 'not set'}} <br/>
            nextEnabled = {{nextEnabled}}
        </div>
        <template v-if="currentQuestion">
            <question :question="currentQuestion" :current-value="currentValue" @change="setValue"/>
            <div class="actions">
                <button :disabled="!previousEnabled" class="no-loading" @click="previous">Previous</button>
                <button @click="next" :disabled="!nextEnabled" class="no-loading">Next</button>
            </div>
        </template>
        <button class="btn primary" v-if="!currentQuestion" @click="start">Go</button>

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

    const logger = new Logger("gap/Assessment");

    @Component({
        components: {
            Question
        }
    })
    export default class Assessment extends Vue {

        @Prop({ type: Object as () => GapAnalysisAssessment, required: false })
        assessment!: GapAnalysisAssessment;
        started: boolean = false;
        currentQuestionIndex: number = 0;

        /**
         * Responses by questoin ID
         * @type {{string: number|undefined}}
         */
        responseValues: Record<string, number | undefined> = {};

        get currentQuestion(): GapAnalysisQuestion | undefined {
            if (!this.currentQuestionIndex && this.started) {
                return undefined;
            }
            return this.assessment.questionByIndex(this.currentQuestionIndex);
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
            return this.responseValues[questionId] !== undefined;
        }

        start() {
            this.currentQuestionIndex = 0;
            this.started = true;
        }
    }
</script>

<style scoped lang="scss">

</style>