<template>
    <div class="assessment-container">
        <progress-stepper :current="questionIndex" :total="questions.length"/>
        <div class="paddingContainer">
            <h4>{{(questionIndex || 0) + 1}} of {{questions.length}}</h4>
            <template v-if="loading">
                <h3>Loading</h3>
            </template>
            <button class="close" @click="close">Close</button>
            <modal :show="showCloseConfirm">
                <div class="warn"  slot="body">
                    Are you sure you want to close the assessment? Your progress will not be saved.
                    <button @click="showCloseConfirm = false">No, continue with the survey</button>
                    <button @click="close">Yes, close</button>
                </div>
            </modal>

            <template v-if="completed">
                <p class="titleMarkdown">The survey is completed.</p>
            </template>

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
            <div class="cvActions">
                <transition name="fade-in-fast" appear>
                    <p class="validation" v-show="showValidation && responseValidation && responseValidation.message">
                        {{responseValidation.message}}</p>
                </transition>
                <button class="btn btn primary no-loading"
                        @click="nextQuestion()"
                        v-if="hasNextQuestion"
                        :class="{disabled: this.responseValidation && !this.responseValidation.isValid}">
                    Next
                </button>
                <button @click="finish" class="btn btn primary no-loading" v-if="!hasNextQuestion && questionIndex > 0 && completed" :disabled="this.responseValidation && !this.responseValidation.isValid">
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

    const logger = new Logger("Assessment");

    export default Vue.extend({
        name: "Assessment",
        components: {
            QuestionCard,
            ProgressStepper,
            Modal,
        },
        props: {
            assessment: { type: Object as () => CoreValuesAssessment, required: true },
            assessmentResponse: { type: Object as () => CoreValuesAssessmentResponse, required: true },
        },

        data(): {
            loading: boolean,
            questionIndex: number | null,
            completed: boolean,
            showValidation: boolean,
            questions: CoreValuesQuestion[],
            showCloseConfirm: boolean,
        } {
            return {
                loading: false,
                questionIndex: 0,
                completed: false,
                showValidation: false,
                questions: this.assessment.getQuestions(this.assessmentResponse),
                showCloseConfirm: false,
            }
        },
        computed: {
            hasPreviousQuestion(): boolean {
                return isNumber(this.questionIndex) && this.questionIndex > 0
            },
            hasNextQuestion(): boolean {
                return !this.completed
                // if (isNumber(this.questionIndex)) {
                //     let nextIndex = this.questionIndex + 1;
                //     return nextIndex < this.questions.length;
                // }
                // return false;
            },
            currentQuestion(): CoreValuesQuestion | null {
                const index = this.questionIndex;
                if (isNumber(index) && index < this.questions.length) {
                    return this.questions[index];
                }
                return null;
            },
            responseValidation(): ResponseValidation | undefined {
                const question = this.currentQuestion;
                const response = this.currentResponse;

                if (question && response) {
                    return response.isValid(question)
                }

                return undefined;
            },
            currentResponse(): CoreValuesQuestionResponse | null {
                const questionId = this.currentQuestion?.id;
                if (!questionId) {
                    return null;
                }
                return this.assessmentResponse?.getResponseForQuestion(questionId) ?? null;
            }
        },
        methods: {
            close() {
                if (!this.showCloseConfirm) {
                    this.showCloseConfirm = true;
                    return;
                }
                this.showCloseConfirm = false;
                this.$emit("close");
            },
            async save() {
                this.$emit("save", this.assessmentResponse);
                this.questions = this.assessment.getQuestions(this.assessmentResponse);
            },
            start() {
                this.questionIndex = 0;
            },
            async finish() {
                this.completed = true;
                this.assessmentResponse.completed = true;
                this.$emit("completed", this.assessmentResponse);
            },
            async updateResponse(response: CoreValuesQuestionResponse) {
                this.assessmentResponse?.setResponse(response);
                await this.save()
            },
            previousQuestion() {
                if (isNull(this.currentQuestion)) {
                    this.questionIndex = 0;
                    return;
                } else if (isNumber(this.questionIndex)) {
                    this.questionIndex = Math.max(0, this.questionIndex - 1);
                    this.completed = false
                }
            },
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
                        this.questionIndex = nextIndex;
                    }
                }
            }
        },
    })
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .assessment-container {
        position: relative;
        text-align: center;

        @include r(768) {
            @include shadowbox;
            margin: 6.4rem auto;
            overflow: hidden;
        }
    }

    .paddingContainer {
        padding: 2.4rem;

        @include r(768) {
            padding: 3.2rem;
        }
    }

    .cvActions {
        background-color: transparentize($white, .15);
        bottom: 0;
        left: 0;
        padding: 1.6rem;
        position: fixed;
        right: 0;

        @include r(768) {
            background-color: transparent;
            padding: 0;
            position: relative;
        }

        button {
            width: 100%;
        }
    }

    .validation {
        color: $red;
        font-size: 1.6rem;
        padding-bottom: .8rem;

        @include r(768) {
            left: 0;
            position: absolute;
            right: 0;
            top: -2.8rem;
        }
    }

    .backArrowbtn {
        left: 1.2rem;
        position: absolute;
        top: 2rem;

        @include r(768) {
            left: 1.9rem;
            top: 3.1rem;
        }
    }

    .backArrow {
        fill: $green;
        height: 1.4rem;
        transform: rotate(180deg);
        width: 1.4rem;
    }

    .titleMarkdown {
        margin: 3.2rem auto 4rem;
    }
</style>
