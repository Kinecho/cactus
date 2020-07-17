<template>
    <div class="assessment-container">
        <progress-stepper :current="questionIndex" :total="questions.length"/>
        <div class="paddingContainer">
            <h4 v-if="started">{{(questionIndex || 0) + 1}} of {{questions.length}}</h4>
            <template v-if="loading">
                <h3>Loading</h3>
            </template>
            <button aria-label="Close" @click="close" title="Close" class="close tertiary icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                    <path fill="#33CCAB" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
                </svg>
            </button>
            <modal :show="showCloseConfirm" @close="showCloseConfirm = false" :dark="true">
                <div class="close-confirm-modal paddingContainer" slot="body">
                    <h3>Leave Core Values?</h3>
                    <p class="subtext">Are you sure you want to leave the Core Values exercise? Your progess will be
                        lost.</p>
                    <div class="btnContainer">
                        <button @click="showCloseConfirm = false">No, keep going</button>
                        <button class="secondary" @click="close">Leave exercise</button>
                    </div>
                </div>
            </modal>

            <template v-if="completed">
                <p class="titleMarkdown">You completed the quiz!</p>
            </template>

            <div v-if="!started" class="intro">
                <h1>What are your core values?</h1>
                <p>Core values are the general expression of what is most important for you, and they help you understand past decisions and make better decisions in the future.</p>
                <button class="btn primary" @click="start">Let's go!</button>
                <div class="private">
                    <img class="lock" src="/assets/icons/lock.svg" alt=""/>
                    All answers are private and confidential and will be used solely to help tune Cactus to be most
                    effective for you.
                </div>
            </div>

            <template v-else-if="currentQuestion && currentResponse">
                <button class="backArrowbtn btn tertiary icon" @click="previousQuestion()" v-if="hasPreviousQuestion">
                    <svg class="backArrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <question-card :question="currentQuestion"
                        :response="currentResponse"
                        :assessment-response="assessmentResponse"
                        :assessment="assessment"
                        @updated="updateResponse"/>
            </template>
            <div class="cvActions" v-if="started">
                <transition name="fade-in-fast" appear>
                    <p class="validation" v-show="showValidation && responseValidation && responseValidation.message">
                        {{responseValidation.message}}</p>
                </transition>
                <button v-if="hasNextQuestion && started"
                        class="btn btn primary no-loading"
                        @click="nextQuestion()"

                        :class="{disabled: this.responseValidation && !this.responseValidation.isValid}">
                    Next
                </button>
                <button v-if="!hasNextQuestion && questionIndex > 0 && completed"
                        @click="finish" class="btn btn primary no-loading"
                        :disabled="this.responseValidation && !this.responseValidation.isValid">
                    Get My Results
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
    import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
    import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
    import { isNull, isNumber } from "@shared/util/ObjectUtil";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import QuestionCard from "@components/corevalues/Question.vue";
    import CoreValuesQuestionResponse, { ResponseValidation } from "@shared/models/CoreValuesQuestionResponse";
    import Modal from "@components/Modal.vue";
    import Logger from "@shared/Logger";
    import { logCoreValuesAssessmentProgress } from "@web/analytics";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";

    const logger = new Logger("Assessment");

    @Component({
        components: {
            QuestionCard,
            ProgressStepper,
            Modal,
        },
    })
    export default class Assessment extends Vue {
        name = "Assessment";

        @Prop({ type: Object as () => CoreValuesAssessment, required: true })
        assessment!: CoreValuesAssessment;

        @Prop({ type: Object as () => CoreValuesAssessmentResponse, required: true })
        assessmentResponse!: CoreValuesAssessmentResponse;

        started = false;
        loading: boolean = false;
        questionIndex: number | null = 0;
        completed: boolean = false;
        showValidation: boolean = false;
        showCloseConfirm: boolean = false;
        questions: CoreValuesQuestion[] = []

        beforeMount() {
            this.questions = this.assessment.getQuestions(this.assessmentResponse);
        }

        get hasPreviousQuestion(): boolean {
            return isNumber(this.questionIndex) && this.questionIndex > 0
        }

        get hasNextQuestion(): boolean {
            return !this.completed
            // if (isNumber(this.questionIndex)) {
            //     let nextIndex = this.questionIndex + 1;
            //     return nextIndex < this.questions.length;
            // }
            // return false;
        }

        get currentQuestion(): CoreValuesQuestion | null {
            const index = this.questionIndex;
            if (isNumber(index) && index < this.questions.length) {
                return this.questions[index];
            }
            return null;
        }

        get responseValidation(): ResponseValidation | undefined {
            const question = this.currentQuestion;
            const response = this.currentResponse;

            if (question && response) {
                return response.isValid(question)
            }

            return undefined;
        }

        get currentResponse(): CoreValuesQuestionResponse | null {
            const questionId = this.currentQuestion?.id;
            if (!questionId) {
                return null;
            }
            return this.assessmentResponse?.getResponseForQuestion(questionId) ?? null;
        }

        close() {
            if (!this.showCloseConfirm) {
                this.showCloseConfirm = true;
                return;
            }
            this.showCloseConfirm = false;
            this.$emit("close");
        }

        async save() {
            this.$emit("save", this.assessmentResponse);
            this.questions = this.assessment.getQuestions(this.assessmentResponse);
        }

        start() {
            this.started = true;
            this.questionIndex = 0;
        }

        async finish() {
            this.completed = true;
            this.assessmentResponse.completed = true;
            this.$emit("completed", this.assessmentResponse);
        }

        async updateResponse(response: CoreValuesQuestionResponse) {
            this.assessmentResponse?.setResponse(response);
            await this.save()
        }

        previousQuestion() {
            if (isNull(this.currentQuestion)) {
                this.questionIndex = 0;
                return;
            } else if (isNumber(this.questionIndex)) {
                this.questionIndex = Math.max(0, this.questionIndex - 1);
                this.completed = false
            }
        }

        nextQuestion() {

            this.questions = this.assessment.getQuestions(this.assessmentResponse);
            if (this.responseValidation?.isValid === false) {
                this.showValidation = true
                return;
            } else {
                this.showValidation = false;
            }


            if (isNull(this.currentQuestion)) {
                this.questionIndex = 0;
                return;
            } else if (isNumber(this.questionIndex)) {
                let nextIndex = this.questionIndex + 1;
                if (nextIndex >= this.questions.length) {
                    this.completed = true;
                } else {
                    logCoreValuesAssessmentProgress(nextIndex);
                    this.questionIndex = nextIndex;
                }
            }
        }

    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "assessment.scss";
</style>
