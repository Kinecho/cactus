<template>
    <div class="assessment-container">
        <progress-stepper :current="currentStepperIndex || 0" :total="stepperTotal" type="rectangle"/>
        <button aria-label="Close" title="Close" class="close tertiary icon" @click="showCloseConfirm = true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path fill="#33CCAB" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <modal :show="showCloseConfirm" @close="showCloseConfirm = false">
            <div class="close-confirm-modal paddingContainer" slot="body">
                <h3>Close assessment?</h3>
                <p class="subtext">Are you sure you want to close the assessment? Your progress will not be saved.</p>
                <div class="btnContainer">
                    <button @click="showCloseConfirm = false">Continue assessment</button>
                    <button class="secondary" @click="close">Close &amp; discard</button>
                </div>
            </div>
        </modal>
        <transition name="component-fade" mode="out-in" appear>
            <div v-if="!started" class="intro" key="intro">
                <p>The Cactus Mental Fitness Quiz is the first step towards understanding yourself better. Together, we will identify areas of your life to improve.</p>
                <p>All answers are private and confidential and will be used solely to help you understand your mental fitness.</p>
                <button class="btn primary" @click="start">Let's Go!</button>
            </div>
            <!-- Note: This needs to be a div (not template) so that the fade transitoin works -->
            <div v-else-if="currentQuestion && !finished && started" key="question-container">
                <div class="paddingContainer">
                    <h4>{{currentQuestionIndex + 1}} of {{stepperTotal - 1 }}</h4>
                    <button class="backArrowbtn btn tertiary icon no-loading" @click="previous" v-if="previousEnabled">
                        <svg class="backArrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                    <transition name="component-fade" mode="out-in">
                        <question :question="currentQuestion" :current-value="currentValue" @change="setValue" :key="`question_${currentQuestionIndex}`"/>
                    </transition>
                    <div class="cvActions">
                        <button class="btn primary no-loading"
                                @click="next"
                                :disabled="!nextEnabled">
                            Next
                        </button>
                    </div>
                </div>
            </div>
            <div v-else-if="processingResults">
                <results-processing/>
            </div>
            <div v-else-if="finished && result && !selectFocusArea">
                <results-onboarding :results="result"/>
                <div class="cvActions">
                    <button class="btn primary" @click="selectFocusArea = true">Next</button>
                </div>
                <cactus-confetti :running="true"/>
            </div>
            <div v-else-if="selectFocusArea && !showUpsell">
                <h4>Select an element to focus on.</h4>
                <results :selectable-elements="true" :results="result" chart-id="select_results_chart" @elementSelected="elementSelected"/>
                <p>{{selectedElement}}</p>
                <button @click="selectedElementContinue">Done (not wired)?</button>
            </div>
            <div v-else-if="showUpsell">
                <LoadableGapAnalysisUpsell :element="selectedElement" :billing-period="upsellBillingPeriod" @checkout="startCheckout"/>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import Question from "@components/gapanalysis/Question.vue";
    import GapAnalysisQuestion from "@shared/models/GapAnalysisQuestion";
    import { Prop, Watch } from "vue-property-decorator";
    import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
    import Logger from "@shared/Logger";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import RadarChart from "@components/RadarChart.vue";
    import CactusConfetti from "@components/CactusConfetti.vue";
    import ResultsOnboarding from "@components/gapanalysis/ResultsOnboarding.vue";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import Modal from "@components/Modal.vue";
    import ResultsProcessing from "@components/gapanalysis/ResultsProcessing.vue";
    import Results from "@components/gapanalysis/Results.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import LoadableGapAnalysisUpsell from "@components/gapanalysis/LoadableGapAnalysisUpsell.vue";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import { startCheckout } from "@web/checkoutService";

    const logger = new Logger("gap/Assessment");

    @Component({
        components: {
            LoadableGapAnalysisUpsell,
            Results,
            ResultsProcessing,
            ResultsOnboarding,
            RadarChart,
            Question,
            CactusConfetti,
            ProgressStepper,
            Modal,
        }
    })
    export default class Assessment extends Vue {
        @Prop({ type: Object as () => GapAnalysisAssessment, required: false })
        assessment!: GapAnalysisAssessment;

        started: boolean = false;
        finished: boolean = false;
        result: GapAnalysisAssessmentResult | undefined;
        currentQuestionIndex: number = 0;

        upsellBillingPeriod = BillingPeriod.yearly;

        /**
         * Responses by questionID
         * @type {{string: number|undefined}}
         */
        responseValues: Record<string, number | undefined> = {};

        showCloseConfirm = false;

        processingResults = false;

        processingTimeout?: number;

        selectFocusArea = false;

        selectedElement: CactusElement | null = null;

        showUpsell = false;

        @Watch("currentQuestionIndex")
        emitPageChange(newIndex: number) {
            this.$emit('questionChanged', newIndex);
        }

        destroyed() {
            window.clearTimeout(this.processingTimeout);
        }

        elementSelected(element: CactusElement | undefined) {
            this.selectedElement = element ?? null;
        }

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
            this.processingResults = true;
            this.processingTimeout = window.setTimeout(() => {
                this.processingResults = false;
            }, 2500);
            this.result = result;
        }

        exitAssessment() {
            this.$emit('finished', this.result);
        }

        start() {
            this.currentQuestionIndex = 0;
            this.started = true;
        }

        get currentStepperIndex(): number {
            if (!this.started) {
                return 0;
            }
            if (this.result) {
                return this.stepperTotal - 1;
            }
            return (this.currentQuestionIndex ?? 0) + 1;
        }

        /**
         * plus 1 because of questins (which is index - 1) + intro and results
         * @return {number}
         */
        get stepperTotal(): number {
            return this.assessment.questions.length + 1;
        }

        async close() {
            if (this.showCloseConfirm) {
                this.$emit('close')
            }
            this.showCloseConfirm = true;
            return;
        }

        selectedElementContinue() {
            this.showUpsell = true;
        }

        async startCheckout(subscriptionProduct: SubscriptionProduct | undefined | null) {
            if (subscriptionProduct?.entryId) {
                await startCheckout({ subscriptionProductId: subscriptionProduct.entryId });
            }
        }
    }
</script>

<style scoped lang="scss">
    //noinspection CssUnknownTarget
    @import "~assessment";
    @import "variables";
    @import "mixins";
    @import "transitions";

    .intro {
        margin: 3.2rem auto 4rem;
        text-align: left;

        p {
            margin-bottom: 2.4rem;
        }
    }

</style>
