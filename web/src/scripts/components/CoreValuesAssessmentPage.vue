<template>
    <div class="coreValuesPage">
        <div class="centered">
            <assessment
                    v-if="!upsell"
                    :assessment="assessment"
                    :assessmentResponse="assessmentResponse"
                    :question-index="questionIndex"
                    :loading="loading"
                    :questions="questions"
                    :done="done"
                    @start="onStart"
                    @response="onResponse"
                    @next="next"
                    @previous="previous"
                    @save="save"
                    @close="close"
                    @completed="complete"
            />
            <div v-else-if="upsell" class="assessment-container">
                <div v-if="checkoutError" class="error alert">{{checkoutError}}</div>
<!--Need some way to cancel/skip/close-->
<!--                <button aria-label="Close" @click="close" title="Close" class="close tertiary icon">-->
<!--                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">-->
<!--                        <path fill="#33CCAB" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>-->
<!--                    </svg>-->
<!--                </button>-->
                <quiz-results-upsell
                        :billing-period="billingPeriod"
                        :checkout-loading="checkoutLoading"
                        @checkout="checkout"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import CactusMember from "@shared/models/CactusMember";
    import { Prop } from "vue-property-decorator";
    import Assessment from "@components/corevalues/Assessment.vue";
    import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
    import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
    import { logCoreValuesAssessmentCompleted } from "@web/analytics";
    import { pushRoute } from "@web/NavigationUtil";
    import { NamedRoute, PageRoute } from "@shared/PageRoutes";
    import CoreValuesAssessmentResponseService from "@web/services/CoreValuesAssessmentResponseService";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import QuizResultsUpsell from "@components/upgrade/LoadableQuizResultsUpsell.vue";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import CoreValueResults from "@components/insights/CoreValueResults.vue";
    import { startCheckout } from "@web/checkoutService";
    import Logger from "@shared/Logger"
    import { appendQueryParams } from "@shared/util/StringUtil";
    import { QueryParam } from "@shared/util/queryParams";
    import { isNull } from "@shared/util/ObjectUtil";
    import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
    import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";

    const logger = new Logger("CoreValuesAssessmentPage");

    @Component({
        components: {
            CoreValueResults,
            QuizResultsUpsell,
            Assessment,
        }
    })
    export default class CoreValuesAssessmentPage extends Vue {
        name = "CoreValuesAssessmentPage";

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: Number, required: false, default: null })
        page!: number | null;

        @Prop({ type: String, required: false, default: null })
        responseId!: string | null;

        @Prop({ type: Boolean, required: false, default: false })
        done!: boolean;

        @Prop({type: Boolean, default: false})
        upsell!: boolean;

        loading = false;
        error: string | null = null;
        assessment!: CoreValuesAssessment;
        assessmentResponse: CoreValuesAssessmentResponse | null = null;

        // showResults = false;
        checkoutLoading = false;
        checkoutError: string | null = null;

        questions: CoreValuesQuestion[] = []

        // coreValues: CoreValue[] = []; //used for showing results

        async beforeMount() {
            this.assessment = CoreValuesAssessment.default();
            this.questions = this.assessment.getQuestions();
            if (this.responseId) {
                this.loading = true;
                this.assessmentResponse = await CoreValuesAssessmentResponseService.sharedInstance.getById(this.responseId) ?? null
                logger.info("Fetched existing response");
                this.loading = false;
            }
        }

        get questionIndex(): number {
            logger.info("Get the question index");
            if (this.done) {
                return this.questions.length - 1;
            }

            if (isNull(this.page)) {
                return 0;
            }

            return Math.max(this.page - 1, 0);
        }

        async complete() {
            logCoreValuesAssessmentCompleted();
            const assessmentResponse = this.assessmentResponse;
            if (!assessmentResponse) {
                return;
            }
            assessmentResponse.completed = true;
            assessmentResponse.results = this.assessment.getResults(assessmentResponse);
            this.assessmentResponse = assessmentResponse
            await this.save();
            assessmentResponse.completed = true;

            if (isPremiumTier(this.member.tier)) {
                await this.close();
                return;
            }
            // this.upsell = true;
            this.goToUpgrade();
        }

        get billingPeriod(): BillingPeriod {
            return BillingPeriod.yearly;
        }

        async close() {
            await pushRoute(PageRoute.MEMBER_HOME)
        }

        async onResponse(response: CoreValuesQuestionResponse) {
            this.assessmentResponse?.setResponse(response);
            await this.save()
        }

        async onStart() {
            if (!this.assessmentResponse) {
                this.assessmentResponse = CoreValuesAssessmentResponse.create({
                    version: this.assessment.version,
                    memberId: this.member.id!
                });
            }
            await this.save();
            const id = this.assessmentResponse.id;
            if (!id) {
                this.error = "Uh oh, something went wrong. Please try again later.";
                return;
            }

            await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT, params: { resultsId: id } })
        }

        async goToDone() {
            try {
                await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT_PAGE, params: { index: "done" } })
            } catch (error) {
                logger.error("Failed to push route", error);
            }
        }

        async goToUpgrade() {
            try {
                await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT_PAGE, params: { index: "upgrade" } })
            } catch (error) {
                logger.error("Failed to push route", error);
            }
        }

        async goToIndex(index: number | null, id?: string) {
            try {
                const params: Record<string, string> = {};
                if (!isNull(index)) {
                    if (index >= this.questions.length) {
                        await this.goToDone()
                        return;
                    }

                    params.index = `${ index + 1 }`
                }
                logger.info("Route params", params);
                await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT_PAGE, params })
            } catch (error) {
                logger.error("Failed to navigate to route", error);
                this.error = error.message ?? "Whoops, something went wrong there."
            }
        }

        async next() {
            const nextIndex = (this.questionIndex ?? 0) + 1;
            await this.goToIndex(nextIndex);
        }

        async previous() {
            const nextIndex = Math.max((this.questionIndex ?? 0) - 1, 0);
            await this.goToIndex(nextIndex);
        }

        async save() {
            const assessmentResponse = this.assessmentResponse;
            this.questions = this.assessment.getQuestions(assessmentResponse);
            if (!assessmentResponse) {
                return;
            }
            const saved = await CoreValuesAssessmentResponseService.sharedInstance.save(assessmentResponse);
            if (saved) {
                this.assessmentResponse = saved;
            }
        }


        async checkout(subscriptionProduct: SubscriptionProduct | undefined | null) {
            logger.info("Starting checkout handler");
            this.checkoutError = null;
            if (subscriptionProduct?.entryId) {
                this.checkoutLoading = true;
                logger.info("Starting checkout for product entry ID = ", subscriptionProduct?.entryId)

                let checkoutSuccessUrl = appendQueryParams(PageRoute.MEMBER_HOME, { [QueryParam.FROM]: "core-values" });
                let checkoutCancelUrl = window.location.href;

                const checkoutResult = await startCheckout({
                    subscriptionProductId: subscriptionProduct.entryId,
                    subscriptionProduct: subscriptionProduct,
                    stripeSuccessUrl: checkoutSuccessUrl,
                    stripeCancelUrl: checkoutCancelUrl,
                });

                if (checkoutResult.success) {
                    await pushRoute(checkoutSuccessUrl)
                } else {
                    this.checkoutError = "Oops, something's not right. Please try again later.";
                }

            } else {
                logger.warn("no subscription product or entry id was found");
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "assessment";

    .coreValuesPage {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;
        position: relative;


        &:after {
            background: url(/assets/images/cvBlob.png) no-repeat;
            content: "";
            display: block;
            height: 35rem;
            overflow: hidden;
            position: absolute;
            left: 70%;
            top: -26rem;
            width: 40rem;
        }

        &:before {
            background: url(/assets/images/pinkVs.svg) no-repeat;
            background-size: cover;
            content: "";
            display: block;
            height: 17rem;
            overflow: hidden;
            position: absolute;
            right: 70%;
            top: 70%;
            width: 18rem;
        }

        @include r(768) {
            background-color: $beige;

            &:after {
                top: -22rem;
                z-index: 0;
            }
        }

        header, .centered {
            width: 100%;
        }

        .centered {
            flex-grow: 1;
            max-width: 768px;
            padding: 0;
            position: relative;
            text-align: left;
            width: 100%;
            z-index: 1;
        }

        h1 {
            margin: 3.2rem 0 1.6rem;

            @include r(768) {
            margin: 6.4rem 0 1.6rem;
            }
        }

        p {
            margin-bottom: 1.6rem;
            max-width: 64rem;
        }
    }

</style>