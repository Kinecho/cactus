<template>
    <assessment
            v-if="!showUpgrade"
            :assessment="assessment"
            :assessmentResponse="assessmentResponse"
            @close="closeAssessment"
            @save="save"
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
    import { PageRoute } from "@shared/PageRoutes";
    import AssessmentResponseService from "@web/services/AssessmentResponseService";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import QuizResultsUpsell from "@components/upgrade/LoadableQuizResultsUpsell.vue";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import CoreValueResults from "@components/insights/CoreValueResults.vue";
    import { CoreValue } from "@shared/models/CoreValueTypes";
    import { startCheckout } from "@web/checkoutService";
    import Logger from "@shared/Logger"
    import { appendQueryParams } from "@shared/util/StringUtil";
    import { QueryParam } from "@shared/util/queryParams";

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

        assessment!: CoreValuesAssessment;
        assessmentResponse!: CoreValuesAssessmentResponse;
        showUpgrade = false;
        showResults = false;
        checkoutLoading = false;
        checkoutError: string | null = null;

        beforeMount() {
            this.assessment = CoreValuesAssessment.default();
            this.assessmentResponse = CoreValuesAssessmentResponse.create({
                version: this.assessment.version,
                memberId: this.member.id!
            });
        }

        async complete(assessmentResponse: CoreValuesAssessmentResponse) {
            logCoreValuesAssessmentCompleted();
            assessmentResponse.completed = true;
            assessmentResponse.results = this.assessment.getResults(assessmentResponse);
            this.assessmentResponse = assessmentResponse
            await this.save(assessmentResponse);
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

        async save(assessmentResponse: CoreValuesAssessmentResponse) {
            const saved = await AssessmentResponseService.sharedInstance.save(assessmentResponse);
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