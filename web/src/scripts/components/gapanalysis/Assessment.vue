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
            <div v-if="currentScreen === Screen.intro" class="intro" key="intro">
                <h1>Mental Fitness Quiz</h1>
                <p>The Cactus Mental Fitness Quiz is the first step towards understanding yourself better. Together, we
                    will identify areas of your life to improve.</p>
                <button class="btn primary" @click="start">Let's Go!</button>
                <div class="private">
                    <img class="lock" src="assets/images/lock.svg" alt=""/>
                    All answers are private and confidential and will be used solely to help you understand your mental
                    fitness.
                </div>
            </div>
            <!-- Note: This needs to be a div (not template) so that the fade transitoin works -->
            <div v-else-if="currentQuestion && currentScreen === Screen.questions" key="question-container">
                <div class="paddingContainer">
                    <h4>{{currentQuestionIndex + 1}} of {{questionsTotal}}</h4>
                    <button class="backArrowbtn btn tertiary icon no-loading" @click="previousQuestion" v-if="previousQuestionEnabled">
                        <svg class="backArrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                    <transition name="component-fade" mode="out-in">
                        <question :question="currentQuestion"
                                :current-value="currentValue"
                                @change="setValue"
                                :key="`question_${currentQuestionIndex}`"
                                @submit="nextQuestion"
                        />
                    </transition>
                    <div class="cvActions">
                        <button class="btn primary no-loading"
                                @click="nextQuestion"
                                :disabled="!nextQuestionEnabled">
                            {{nextButtonText}}
                        </button>
                    </div>
                </div>
            </div>
            <div class="whiteBg" v-else-if="currentScreen === Screen.pendingResults">
                <results-processing/>
            </div>
            <div class="whiteBg" v-else-if="currentScreen === Screen.results">
                <results-onboarding :results="result"/>
                <div class="cvActions">
                    <button class="btn primary" @click="setScreen(Screen.chooseFocus)">Next: Choose Your Focus</button>
                </div>
                <cactus-confetti :running="false"/>
            </div>
            <div class="whiteBg" v-else-if="currentScreen === Screen.chooseFocus">
                <h2>Choose your focus</h2>
                <p class="subtext">Tap a cactus to continue. Your choice will be used to personalize questions designed
                    to help you focus on what makes you happy.</p>
                <results :selectable-elements="true" :results="result" chart-id="select_results_chart" @elementSelected="elementSelected" :withAnimation="true"/>
                <p v-if="selectedElement">You chose <strong>{{selectedElement}}</strong>.</p>
                <div class="cvActions flexActions">
                    <button class="no-loading" @click="focusSelected" :disabled="!selectedElement">Next
                    </button>
                </div>
            </div>
            <template v-else-if="currentScreen === Screen.upgrade">
                <LoadableGapAnalysisUpsell :element="selectedElement" :billing-period="upsellBillingPeriod" @checkout="startCheckout" @skip="skipCheckout"/>
            </template>
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
    import { pushRoute } from "@web/NavigationUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";

    const logger = new Logger("gap/Assessment");

    /**
     * Screen Names
     * @type {{upgrade: string; intro: string; pendingResults: string; questions: string; chooseFocus: string; results: string}}
     */
    const Screen = {
        intro: "intro",
        questions: "questions",
        pendingResults: "pendingResults",
        results: "results",
        chooseFocus: "choose-focus",
        upgrade: "upgrade"
    }

    /**
     * Screen Order
     * @type {(string)[]}
     */
    const defaultScreens = [
        Screen.intro,
        Screen.questions,
        Screen.pendingResults,
        Screen.results,
        Screen.chooseFocus,
        Screen.upgrade
    ];

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

        @Prop({ type: Boolean, required: false, default: true })
        includeUpsell!: boolean;

        started: boolean = false;
        finished: boolean = false;
        result: GapAnalysisAssessmentResult | undefined;
        currentQuestionIndex: number = 0;
        currentScreenIndex: number = 0;
        Screen = Screen;
        upsellBillingPeriod = BillingPeriod.yearly;


        /**
         * Responses by questionID
         * @type {{string: number|undefined}}
         */
        responseValues: Record<string, number | undefined> = {};
        showCloseConfirm = false;
        processingTimeout?: number;
        selectedElement: CactusElement | null = null;
        currentScreen: string = Screen.intro;

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

        get nextButtonText(): string {
            if (this.currentQuestionIndex === this.assessment.questions.length - 1) {
                return "Get Results";
            }

            return "Next";
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

        nextQuestion() {
            if (this.currentQuestionIndex >= this.assessment.questions.length - 1) {
                this.finishAssessment();
                return
            }
            this.currentQuestionIndex += 1;
            // this.currentScreenIndex += 1;
        }

        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex = this.currentQuestionIndex - 1;
                // this.currentScreenIndex -= 1;
            }
        }

        get previousQuestionEnabled(): boolean {
            return this.currentQuestionIndex != undefined && this.currentQuestionIndex > 0;
        }

        get screens(): string[] {
            return [...defaultScreens].filter(screen => {
                if (screen === Screen.upgrade && !this.includeUpsell) {
                    return false;
                }
                return true;
            })
        }

        get nextQuestionEnabled(): boolean {
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
            // this.processingResults = true;
            this.setScreen(Screen.pendingResults);
            this.processingTimeout = window.setTimeout(() => {
                // this.processingResults = false;
                this.setScreen(Screen.results);
            }, 2500);
            this.result = result;
            this.$emit('finished', this.result);
        }


        start() {
            this.currentQuestionIndex = 0;
            this.started = true;
            this.setScreen("questions");
        }

        setScreen(name: string) {
            logger.info("Setting screen...", name);
            this.currentScreenIndex = Math.max(0, this.screens.indexOf(name));
            this.currentScreen = this.screens[this.currentScreenIndex];
        }

        async focusSelected() {
            await CactusMemberService.sharedInstance.setFocusElement({ element: this.selectedElement });

            if (this.includeUpsell) {
                this.setScreen(Screen.upgrade)
            } else {
                this.$emit('close')
            }
        }

        get currentStepperIndex(): number {
            if (!this.started) {
                return 0;
            }
            return this.currentScreenIndex + this.currentQuestionIndex;
            // if (this.result) {
            //     return this.stepperTotal - 1;
            // }
            // return (this.currentQuestionIndex ?? 0) + 1;
        }

        /**
         * plus 1 because of questins (which is index - 1) + intro and results
         * @return {number}
         */
        get stepperTotal(): number {
            return this.assessment.questions.length + this.screens.length;
        }

        get questionsTotal(): number {
            return this.assessment.questions.length;
        }

        async close() {
            if (this.showCloseConfirm) {
                this.$emit('close')
            }
            this.showCloseConfirm = true;
            return;
        }

        async skipFocus() {
            logger.info("Skipping focus");
            const c = confirm("Are you sure you want to skip choosing your element?")
            if (c) {
                await pushRoute(PageRoute.INSIGHTS);
            }
        }

        async skipCheckout() {
            logger.info("Skipping checkout");
            const c = confirm("Are you sure you want to skip upgrading?")
            if (c) {
                await pushRoute(PageRoute.INSIGHTS);
            }
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
        padding: 8rem 2.4rem 19.2rem;
        text-align: left;

        @include r(768) {
            padding: 8rem 6.4rem 19.2rem;
            text-align: center;
        }

        h1 {
            margin-bottom: .8rem;
        }

        p {
            font-size: 2rem;
            margin-bottom: 3.2rem;
            opacity: .8;
        }

        button {
            width: 100%;

            @include r(600) {
                min-width: 18rem;
                width: auto;
            }
        }
    }

    .private {
        background-color: #EFF4F5;
        bottom: 0;
        display: flex;
        font-size: 1.4rem;
        left: 0;
        padding: 1.6rem 2.4rem;
        position: fixed;
        right: 0;

        @include r(768) {
            align-items: center;
            flex-direction: column;
            padding: 2.4rem 16rem;
            position: absolute;
        }
    }

    .lock {
        height: 2.4rem;
        margin: .4rem 1.6rem 0 0;
        width: 2.4rem;

        @include r(768) {
            height: 1.8rem;
            margin: 0 0 .8rem 0;
            width: 1.8rem;
        }
    }

    .whiteBg {
        background-color: $white;
        font-size: 2rem;
        min-height: 100vh;
        padding: 6.4rem 2.4rem;

        @include r(768) {
            background-color: transparent;
            min-height: 0;
        }
    }

    .subtext {
        margin: 0 auto 2.4rem;
        max-width: 48rem;
        opacity: .8;
    }

    .flexActions {
        flex-direction: column;

        @include r(768) {
            display: flex;
            margin-top: 6.4rem;
        }

        button {
            margin-bottom: .8rem;
            min-width: 0;
        }
    }
</style>
