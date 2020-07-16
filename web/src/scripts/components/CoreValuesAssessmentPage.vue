<template>
    <div>
        <assessment :assessment="assessment"
                :assessmentResponse="assessmentResponse"
                v-if="!showUpgrade"
                @close="closeAssessment"
                @save="save"
                @completed="complete"/>

        <quiz-results-upsell v-if="showUpgrade" :billing-period="billingPeriod"/>
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
    import QuizResultsUpsell from "@components/upgrade/QuizResultsUpsell.vue";
    import { BillingPeriod } from "@shared/models/SubscriptionProduct";

    @Component({
        components: {
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
        resultsLoading: boolean = false;
        showUpgrade = false;

        beforeMount() {
            this.assessment = CoreValuesAssessment.default();
            this.assessmentResponse = CoreValuesAssessmentResponse.create({
                version: this.assessment.version,
                memberId: this.member.id!
            });
            // this.loadCurrentResults()
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
            // this.assessmentInProgress = false;
            // await this.loadCurrentResults();
            // this.loading = false
        }


        async save(assessmentResponse: CoreValuesAssessmentResponse) {
            const saved = await AssessmentResponseService.sharedInstance.save(assessmentResponse);
            if (saved) {
                this.assessmentResponse = saved;
            }
        }

        async loadCurrentResults() {
            this.resultsLoading = true;
            const memberId = this.member.id
            if (!memberId) {
                this.resultsLoading = false;
                return
            }
            const currentResults = await AssessmentResponseService.sharedInstance.getLatestForUser(memberId);
            if (currentResults) {
                this.assessmentResponse = currentResults;
                // if (currentResults.assessmentVersion.localeCompare(this.assessment.version) < 0) {
                //     this.newAssessmentAvailable = true;
                // }
            }
            this.resultsLoading = false;
        }

    }
</script>

<style scoped lang="scss">

</style>