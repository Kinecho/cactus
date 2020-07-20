<template>
    <div class="assessment-container">
        <progress-stepper :current="currentStepperIndex || 0" :total="stepperTotal" type="rectangle"/>
        <button aria-label="Close" title="Close" class="close tertiary icon" @click="closeOrSkipUpsell">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path fill="#33CCAB" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <modal :show="showCloseConfirm" @close="showCloseConfirm = false" :dark="true">
            <div class="close-confirm-modal paddingContainer" slot="body">
                <h3>Leave the quiz?</h3>
                <p class="subtext">Are you sure you want to leave the Happiness Quiz? Your results may be lost.</p>
                <div class="btnContainer">
                    <button @click="showCloseConfirm = false">No, keep going</button>
                    <button class="secondary" @click="close">Leave the quiz</button>
                </div>
            </div>
        </modal>
        <upsell-skip-modal :show="showSkipUpsellModal" @confirmed="skipCheckout" @close="showSkipUpsellModal = false"/>
        <transition name="component-fade" mode="out-in" appear>
            <div v-if="currentScreen === Screen.intro" class="intro" key="intro">
                <h1>What makes you happy?</h1>
                <p>The Happiness Quiz is the first step in understanding yourself better. Answer honestly and Cactus
                    will
                    help you identify and focus on the people, places, and things that make you happy.</p>
                <button class="btn primary" @click="start">Let's go!</button>
                <div class="private">
                    <img class="lock" src="/assets/icons/lock.svg" alt=""/>
                    All answers are private and confidential and will be used solely to help tune Cactus to be most
                    effective for you.
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
                    <button class="btn primary" @click="setScreen(Screen.chooseFocus)">Next: Choose your focus</button>
                </div>
                <cactus-confetti :running="false"/>
            </div>
            <div class="whiteBg" v-else-if="currentScreen === Screen.chooseFocus">
                <h2>Choose your focus</h2>
                <p class="subtext">Your choice will be used to personalize Cactus and help you focus on what makes you
                    happy.</p>
                <div class="radarChartContainer">
                    <results :selectable-elements="true"
                            :results="result"
                            :selected-element="selectedElement"
                            chart-id="select_results_chart"
                            @elementSelected="elementSelected"
                    />
                </div>
                <p class="selectedElementText" v-if="selectedElement">You chose <strong>{{selectedElement}}</strong>.
                </p>
                <p class="validationText" v-if="!selectedElement">Tap an element to continue. You can always change this&nbsp;later.</p>
                <div class="cvActions flexActions">
                    <button class="no-loading" @click="focusSelected" :disabled="!selectedElement">
                        {{chooseFocusScreenCta}}
                    </button>
                </div>
            </div>
            <template v-else-if="currentScreen === Screen.upgrade">
                <LoadableGapAnalysisUpsell :element="selectedElement"
                        :billing-period="upsellBillingPeriod"
                        @product="upsellProductLoaded"
                        @checkout="startCheckout"
                        @skip="skipCheckout"/>
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
    import CactusMemberService from "@web/services/CactusMemberService";
    import UpsellSkipModal from "@components/gapanalysis/UpsellSkipModal.vue";
    import { Screen, ScreenName } from "@components/gapanalysis/GapAssessmentTypes";
    import { QueryParam } from "@shared/util/queryParams";
    import { logFocusElementSelected } from "@web/analytics";
    import { removeQueryParam, updateQueryParam } from "@web/util";
    import { appendQueryParams } from "@shared/util/StringUtil";

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
            UpsellSkipModal,
        }
    })
    export default class Assessment extends Vue {
        @Prop({ type: Object as () => GapAnalysisAssessment, required: false })
        assessment!: GapAnalysisAssessment;

        @Prop({ type: Boolean, required: false, default: true })
        includeUpsell!: boolean;

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        result!: GapAnalysisAssessmentResult;

        @Prop({ type: Number, required: false, default: 0 })
        questionIndex!: number;

        /**
         * The screen that is displaying.
         * This property controls what is actually being shown.
         * The passed in prop may be used to set this from an parent component
         */
        @Prop({ type: String, required: false, default: Screen.intro })
        currentScreen!: ScreenName;

        @Prop({ type: Array as () => ScreenName[], required: true })
        screens!: ScreenName[];

        @Prop({ type: String, required: false, default: null })
        checkoutSuccessPath!: string | null

        @Prop({ type: String, required: false, default: null })
        checkoutCancelPath!: string | null

        finished: boolean = false;
        Screen = Screen;
        upsellBillingPeriod = BillingPeriod.yearly;

        /**
         * Responses by questionID
         * @type {{string: number|undefined}}
         */
        responseValues: Record<string, number | undefined> = {};
        showCloseConfirm = false;
        showSkipUpsellModal = false;
        processingTimeout?: number;
        selectedElement: CactusElement | null = null;

        //Note: I don't like this implementation but it was the fastest thing i could come up with
        @Watch("result")
        onResultChanged(newResult: GapAnalysisAssessmentResult) {
            this.responseValues = newResult.responsesByQuestionId;
        }

        beforeMount() {
            this.responseValues = this.result.responsesByQuestionId;
        }

        @Watch("currentQuestionIndex")
        emitPageChange(newIndex: number) {
            this.$emit('questionChanged', newIndex);
        }

        destroyed() {
            window.clearTimeout(this.processingTimeout);
        }

        elementSelected(element: CactusElement | undefined) {
            this.selectedElement = element ?? null;
            if (element) {
                updateQueryParam(QueryParam.SELECTED_ELEMENT, element);
            } else {
                removeQueryParam(QueryParam.SELECTED_ELEMENT);
            }
        }

        async upsellProductLoaded(product: SubscriptionProduct | undefined | null) {
            this.$emit('upsellProductLoaded', product);
        }

        get currentQuestion(): GapAnalysisQuestion | null {
            return this.assessment.questionByIndex(this.currentQuestionIndex) ?? null;
        }

        get chooseFocusScreenCta(): string {
            if (this.includeUpsell) {
                return "Next"
            } else {
                return "Done";
            }
        }

        get nextButtonText(): string {
            if (this.currentQuestionIndex === this.assessment.questions.length - 1) {
                return "Get Results";
            }

            return "Next";
        }

        get currentScreenIndex(): number {
            return this.screens.indexOf(this.currentScreen);
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

            this.result.setAnswer({ questionId, value })
            this.responseValues = this.result.responsesByQuestionId;
        }

        nextQuestion() {
            if (this.currentQuestionIndex >= this.assessment.questions.length - 1) {
                this.finishAssessment();
                return
            }
            this.setQuestionIndex(this.currentQuestionIndex + 1);
        }

        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.setQuestionIndex(this.currentQuestionIndex - 1);
            }
        }

        get previousQuestionEnabled(): boolean {
            return this.currentQuestionIndex != undefined && this.currentQuestionIndex > 0;
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

        setQuestionIndex(index: number) {
            this.$emit('questionChanged', index);
        }

        finishAssessment() {
            const result = this.result;
            result.calculateResults({ assessment: this.assessment });
            logger.info("finishing assessment...", result);
            this.finished = true;

            this.setScreen(Screen.pendingResults);
            this.processingTimeout = window.setTimeout(() => {
                if (this.includeUpsell) {
                    this.setScreen(Screen.upgrade);
                } else {
                    this.setScreen(Screen.results);
                }

            }, 2500);
            this.result = result;
            this.$emit('finished', this.result);
        }

        start() {
            this.setScreen(Screen.questions);
            this.setQuestionIndex(0);
            // this.currentQuestionIndex = 0;
        }

        setScreen(name: string) {
            logger.info("Setting screen...", name);
            this.$emit('screen', name);
            // this.currentScreenIndex = Math.max(0, this.screens.indexOf(name));
            // this.currentScreen = this.screens[this.currentScreenIndex];
        }

        closeOrSkipUpsell() {
            if (this.currentScreen === Screen.upgrade) {
                this.showSkipUpsellModal = true;
            } else {
                this.showCloseConfirm = true;
            }
        }

        async focusSelected() {
            await CactusMemberService.sharedInstance.setFocusElement({ element: this.selectedElement });
            logFocusElementSelected(this.selectedElement);
            if (this.includeUpsell) {
                this.setScreen(Screen.upgrade)
            } else {
                this.$emit('close')
            }
        }

        get currentStepperIndex(): number {
            let questionIndex = this.screens.indexOf(Screen.questions);
            if (this.currentScreenIndex > questionIndex) {
                return this.currentScreenIndex + this.questionsTotal - 1;
            } else {
                return this.currentScreenIndex + this.currentQuestionIndex;
            }
        }

        /**
         * Bounds safe question index
         */
        get currentQuestionIndex(): number {
            return Math.min(Math.max(0, this.questionIndex), this.questionsTotal - 1);
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

        async skipCheckout() {
            await pushRoute(PageRoute.MEMBER_HOME);
        }

        async startCheckout(subscriptionProduct: SubscriptionProduct | undefined | null) {
            logger.info("Starting checkout handler");
            if (subscriptionProduct?.entryId) {
                logger.info("Starting checkout for product entry ID = ", subscriptionProduct?.entryId)
                let defaultSuccessPath = `${ PageRoute.MEMBER_HOME }?${ QueryParam.UPGRADE_SUCCESS }=success`
                if (this.result?.id) {
                    defaultSuccessPath = `${ PageRoute.GAP_ANALYSIS }/${ this.result.id }/${ Screen.results }`
                }

                let checkoutSuccessUrl = this.checkoutSuccessPath ?? defaultSuccessPath;
                let checkoutCancelUrl = this.checkoutCancelPath ?? window.location.href;


                checkoutSuccessUrl = appendQueryParams(checkoutSuccessUrl, {
                    [QueryParam.UPGRADE_SUCCESS]: "success",
                    [QueryParam.FROM]: "gap",
                })

                if (this.selectedElement) {
                    checkoutCancelUrl = appendQueryParams(checkoutCancelUrl, { [QueryParam.SELECTED_ELEMENT]: this.selectedElement });
                }

                const checkoutResult = await startCheckout({
                    subscriptionProductId: subscriptionProduct.entryId,
                    subscriptionProduct: subscriptionProduct,
                    stripeSuccessUrl: checkoutSuccessUrl,
                    stripeCancelUrl: checkoutCancelUrl,
                });

                if (checkoutResult.success) {
                    await pushRoute(checkoutSuccessUrl)
                }
            } else {
                logger.warn("no subscription product or entry id was found");
            }
        }
    }
</script>

<style scoped lang="scss">
    //noinspection CssUnknownTarget
    @import "variables";
    @import "mixins";
    @import "transitions";
    @import "~assessment";

    .whiteBg {
        background-color: $white;
        font-size: 2rem;
        min-height: 100vh;
        padding: 6.4rem 2.4rem 12rem;

        @include r(768) {
            background-color: transparent;
            min-height: 0;
            padding: 6.4rem 2.4rem;
        }
    }

    .subtext {
        margin: 0 auto 2.4rem;
        max-width: 48rem;
        opacity: .8;
    }

    .radarChartContainer {
        margin: 3.2rem auto;

        @include r(600) {
            max-width: 56rem;
        }
    }

    .selectedElementText {
        padding-bottom: 2.4rem;
    }

    .validationText {
        font-size: 1.6rem;
        opacity: .8;
        padding-bottom: 1.6rem;
    }
</style>
