<template>
    <div class="coreValuesPage">
        <div class="centered">
            <assessment
                    v-if="!showUpgrade"
                    :assessment="assessment"
                    :assessmentResponse="assessmentResponse"
                    :question-index="questionIndex"
                    :loading="loading"
                    :questions="questions"
                    :done="done"
                    @start="onStart"
                    @next="next"
                    @previous="previous"
                    @save="save"
                    @close="closeAssessment"
                    @completed="complete"
            />
            <div v-else-if="showResults">
                <core-value-results
                        :core-values="coreValues"
                        :show-dropdown-menu="false"
                />
            </div>
            <div v-else-if="showUpgrade" class="assessment-container">
                <div v-if="checkoutError" class="error alert">{{checkoutError}}</div>
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
    import { Prop, Watch } from "vue-property-decorator";
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
    import { CoreValue, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { startCheckout } from "@web/checkoutService";
    import Logger from "@shared/Logger"
    import { appendQueryParams } from "@shared/util/StringUtil";
    import { QueryParam } from "@shared/util/queryParams";
    import { isNotNull, isNull } from "@shared/util/ObjectUtil";
    import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";

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

        loading = false;
        error: string | null = null;
        assessment!: CoreValuesAssessment;
        assessmentResponse: CoreValuesAssessmentResponse | null = null;
        showUpgrade = false;
        showResults = false;
        checkoutLoading = false;
        checkoutError: string | null = null;

        // questions: CoreValuesQuestion[] = []

        async beforeMount() {
            this.assessment = CoreValuesAssessment.default();

            if (this.responseId) {
                this.loading = true;
                this.assessmentResponse = await CoreValuesAssessmentResponseService.sharedInstance.getById(this.responseId) ?? null
                logger.info("Fetched existing response");
                this.loading = false;
            }
            // this.onResponse(this.assessmentResponse);
            // this.assessmentResponse = CoreValuesAssessmentResponse.create({
            //     version: this.assessment.version,
            //     memberId: this.member.id!
            // });
        }

        get questions() {
            return this.assessment.getQuestions(this.assessmentResponse);
        }

        get questionIndex(): number {
            if (this.done) {
                return this.questions.length - 1;
            }

            if (isNull(this.page)) {
                return 0;
            }

            return Math.max(this.page - 1, 0);
        }

        get assessmentReady() {
            return !!this.assessment && !!this.assessmentResponse;
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
                await this.closeAssessment();
                return;
            }
            this.showUpgrade = true;
        }

        get billingPeriod(): BillingPeriod {
            return BillingPeriod.yearly;
        }

        async closeAssessment() {
            await pushRoute(PageRoute.MEMBER_HOME)
        }

        get coreValues(): CoreValue[] {
            return this.assessmentResponse?.results?.values ?? []
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
            // await this.goToIndex(0, id);
            await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT, params: { resultsId: id } })
            // await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT, params: { resultsId: id } })
            // await this.goToIndex(0);
        }

        async goToDone() {
            try {
                await this.$router.push({ name: NamedRoute.CORE_VALUES_RESULT_PAGE, params: { index: "done" } })
            } catch (error) {
                logger.error("Failed to push route", error);
            }
        }

        async goToIndex(index: number | null, id?: string) {
            try {
                const idParam = id ?? this.responseId
                const params: Record<string, string> = {};
                // if (idParam) {
                //     params.resultsId = idParam;
                // }
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

                // if (this.result?.id) {
                //     defaultSuccessPath = `${ PageRoute.GAP_ANALYSIS }/${ this.result.id }/${ Screen.results }?${ QueryParam.UPGRADE_SUCCESS }=success`
                // }

                let checkoutSuccessUrl = appendQueryParams(PageRoute.MEMBER_HOME, { [QueryParam.FROM]: "core-values" });
                let checkoutCancelUrl = window.location.href;

                // if (this.selectedElement) {
                //     checkoutCancelUrl = appendQueryParams(checkoutCancelUrl, { [QueryParam.SELECTED_ELEMENT]: this.selectedElement });
                // }

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

</style>