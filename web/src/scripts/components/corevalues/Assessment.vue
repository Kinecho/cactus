<template>
    <div class="assessment-container">
        <progress-stepper :current="questionIndex" :total="questions.length"/>
        <button v-if="showCloseButton" aria-label="Close" @click="close" title="Close" class="close tertiary icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path fill="#33CCAB" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <template v-if="loading">
            <h3>Loading</h3>
        </template>
        <transition name="component-fade" mode="out-in" appear>
            <div v-if="!started" class="intro" key="intro">
                <h1>What are your core values?</h1>
                <p>Core values are the general expression of what is most important for you, and they help you
                    understand past decisions and make better decisions in the future.</p>
                <button class="btn primary" @click="start">Let's go!</button>
                <div class="private">
                    <img class="lock" src="/assets/icons/lock.svg" alt=""/>
                    All answers are private and confidential and will be used solely to help tune Cactus to be most
                    effective for you.
                </div>
            </div>
            <div v-else-if="currentQuestion && currentResponse && !done"
                    class="paddingContainer"
                    :key="'questions'">
                <h4>{{ displayIndex }} of {{ questions.length }}</h4>
                <button class="backArrowbtn btn tertiary icon" @click="previousQuestion()" v-if="hasPreviousQuestion">
                    <svg class="backArrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <transition name="component-fade" mode="out-in">
                    <question-card :question="currentQuestion"
                            :key="`question_${questionIndex}`"
                            :response="currentResponse"
                            :options="currentQuestionOptions"
                            @updated="updateResponse"/>
                </transition>
                <div class="cvActions flexActions" v-if="started">
                    <transition name="fade-in-fast" appear>
                        <p class="validation" v-if="showValidation && responseValidation && responseValidation.message" :key="'error'">
                            {{ responseValidation && responseValidation.message }}</p>
                    </transition>
                    <button v-if="hasNextQuestion && started"
                            class="btn btn primary no-loading"
                            @click="nextQuestion()"
                            :class="{disabled: this.responseValidation && !this.responseValidation.isValid}">
                        Next
                    </button>
                </div>
            </div>
            <div v-else-if="done" class="paddingContainer">
                <p class="titleMarkdown">You completed the quiz!</p>
                <div class="cvActions flexActions">
                    <button v-if="!hasNextQuestion && questionIndex > 0 && done"
                            @click="completed"
                            class="btn btn primary no-loading"
                            :disabled="!done && this.responseValidation && !this.responseValidation.isValid"
                    >
                        Get My Results
                    </button>
                </div>
            </div>
        </transition>

        <modal :show="showCloseConfirm" @close="showCloseConfirm = false" :dark="true">
            <div class="close-confirm-modal paddingContainer" slot="body">
                <h3>Leave Core Values?</h3>
                <p class="subtext">Are you sure you want to leave the Core Values exercise? Your progress will be
                    lost.</p>
                <div class="btnContainer">
                    <button @click="showCloseConfirm = false">No, keep going</button>
                    <button class="secondary" @click="close">Leave exercise</button>
                </div>
            </div>
        </modal>
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
import { Prop, Watch } from "vue-property-decorator";
import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";

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

    @Prop({ type: Boolean, default: true })
    showCloseButton!: boolean;

    @Prop({ type: Object as () => CoreValuesAssessment, required: true })
    assessment!: CoreValuesAssessment;

    @Prop({ type: Object as () => CoreValuesAssessmentResponse, required: false })
    assessmentResponse!: CoreValuesAssessmentResponse | null;

    @Prop({ type: Number, default: 0 })
    questionIndex!: number | null;

    @Prop({ type: Boolean, default: false })
    loading!: boolean;

    @Prop({ type: Array as () => CoreValuesQuestion[], default: [] })
    questions!: CoreValuesQuestion[];

    @Prop({ type: Boolean, default: false })
    done!: boolean;

    showValidation: boolean = false;
    showCloseConfirm: boolean = false;
    responseValidation: ResponseValidation | null = null;
    currentQuestionOptions: CoreValuesQuestionOption[] = []
    currentQuestion: CoreValuesQuestion | null = null
    currentResponse: CoreValuesQuestionResponse | null = null;

    @Watch("assessmentResponse")
    onResponseChanged() {
        this.updateAll()
    }

    @Watch("questionIndex")
    onIndexChange(newIndex: number | null, oldIndex: number | null) {
        this.updateAll()
    }

    updateAll() {
        logger.info("Updating all things...");
        this.updateCurrentQuestion();
        this.updateCurrentResponse();
        this.updateCurrentQuestionOptions()
        this.updateResponseValidation();
    }

    beforeMount() {
        this.onIndexChange(this.questionIndex, null);
    }

    get displayIndex(): number {
        if (this.done) {
            return this.questions.length;
        }
        return (this.questionIndex ?? 0) + 1
    }

    get started(): boolean {
        return !isNull(this.questionIndex) && !isNull(this.assessmentResponse);
    }

    get hasPreviousQuestion(): boolean {
        return isNumber(this.questionIndex) && this.questionIndex > 0
    }

    get hasNextQuestion(): boolean {
        return !this.done
    }

    updateCurrentQuestion() {
        const index = this.questionIndex;
        if (isNumber(index) && index < this.questions.length) {
            this.currentQuestion = this.questions[index];
        } else {
            this.currentQuestion = null
        }
    }

    updateResponseValidation() {
        const question = this.currentQuestion;
        const response = this.currentResponse;

        if (question && response) {
            logger.info("Updating response validation because both question & response are present");
            this.responseValidation = response.isValid(question)
        } else {
            this.responseValidation = { isValid: false };
        }
    }

    updateCurrentResponse() {
        const questionId = this.currentQuestion?.id;
        if (!questionId) {
            this.currentResponse = null
            return;
        }
        this.currentResponse = this.assessmentResponse?.getResponseForQuestion(questionId) ?? null;
    }

    updateCurrentQuestionOptions() {
        if (!this.assessmentResponse) {
            this.currentQuestionOptions = []
            return;
        }
        const responses = this.assessment.orderedResponses(this.assessmentResponse) ?? [];
        this.currentQuestionOptions = this.currentQuestion?.options({
            responses,
            currentIndex: this.questionIndex ?? 0,
        }) ?? []
        return;
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
        this.$emit("save");
    }

    start() {
        this.$emit("start");
    }

    async completed() {
        this.$emit("completed");
    }

    async updateResponse(response: CoreValuesQuestionResponse) {
        this.updateResponseValidation();
        this.$emit('response', response)
    }

    previousQuestion() {
        if (isNull(this.currentQuestion)) {
            return;
        } else if (isNumber(this.questionIndex)) {
            this.$emit("previous");
        }
    }

    nextQuestion() {
        this.updateResponseValidation();
        if (this.responseValidation?.isValid === false) {
            this.showValidation = true
            return;
        } else {
            this.showValidation = false;
        }

        if (isNull(this.currentQuestion)) {
            this.$emit('next');
            return;
        } else if (isNumber(this.questionIndex)) {
            let nextIndex = this.questionIndex + 1;
            if (nextIndex >= this.questions.length) {
            } else {
                logCoreValuesAssessmentProgress(nextIndex);
            }
            this.$emit('next');
        }
    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";
@import "transitions";
@import "assessment.scss";

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


</style>
