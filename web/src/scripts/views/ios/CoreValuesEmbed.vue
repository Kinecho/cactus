<template>
    <div v-if="!showResults && assessment && assessmentResponse && showAssessment">
        <assessment :assessment="assessment"
                :assessmentResponse="assessmentResponse"
                @close="close"
                @save="save"
                @completed="complete"/>
    </div>
    <div v-else class="assessment-container">
        <button aria-label="Close" @click="close" title="Close" class="close tertiary icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path fill="#33CCAB" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <template v-if="showResults">
            <core-value-results
                    :core-values="coreValues"
                    :show-dropdown-menu="false"
                    :bordered="false"
                    title="Core Values"
                    :show-description="true"/>
            <button class="secondary retakeBtn" @click="restart">Retake the Assessment</button>
        </template>
        <template v-else-if="showSpinner || error">
            <h2>Core Values</h2>
            <spinner v-if="showSpinner" message="Loading..." class="loader"/>
            <p v-if="error">{{error}}</p>
        </template>
    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import CactusMember from "@shared/models/CactusMember";
    import { Prop } from "vue-property-decorator";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import { logCoreValuesAssessmentCompleted, setUserId } from "@web/analytics";
    import AssessmentResponseService from "@web/services/AssessmentResponseService";
    import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
    import Assessment from "@components/corevalues/Assessment.vue";
    import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
    import { IosDelegate } from "@web/ios/IosAppTypes";
    import Logger from "@shared/Logger"
    import Spinner from "@components/Spinner.vue";
    import IosAppService from "@web/ios/IosAppService";
    import CoreValueResults from "@components/insights/CoreValueResults.vue";
    import { CoreValue } from "@shared/models/CoreValueTypes";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import LoadableQuizResultsUpsell from "@components/upgrade/LoadableQuizResultsUpsell.vue";
    import { BillingPeriod } from "@shared/models/SubscriptionProduct";

    const logger = new Logger("CoreValuesEmbed");

    @Component({
        components: {
            CoreValueResults,
            Spinner,
            Assessment,
            LoadableQuizResultsUpsell
        }
    })
    export default class CoreValuesEmbed extends Vue implements IosDelegate {
        name = "CoreValuesEmbed";

        @Prop({ type: Object as () => CactusMember, required: false, default: null })
        member!: CactusMember | null;

        assessment: CoreValuesAssessment = CoreValuesAssessment.default();
        assessmentResponse: CoreValuesAssessmentResponse | null = null;

        billingPeriod: BillingPeriod = BillingPeriod.yearly;
        appMemberId: string | null = null;
        appDisplayName: string | null = null;
        appSubscriptionTier: SubscriptionTier | null = null;
        appRegistered: boolean = false;
        loading = true;
        resultsLoading = false;
        initTimeout: number | null = null;
        error: string | null = null;
        showAssessment = false;
        existingResults: CoreValuesAssessmentResponse | null = null;
        previousResults: CoreValuesAssessmentResponse | null = null;
        isUpgrading = false;

        beforeMount() {
            this.loading = true;
            this.initTimeout = window.setTimeout(() => {
                this.error = "Unable to load the assessment. Please try again later."
                this.loading = false;
            }, 15000)
            window.CactusIosDelegate = this;
            IosAppService.notifyAppMounted(true);
        }

        destroyed() {
            window.clearTimeout(this.initTimeout ?? undefined);
        }

        get hasExistingResults(): boolean {
            return !!this.existingResults
        }

        get showResults(): boolean {
            return this.isPlusMember && (this.hasExistingResults || (!this.showAssessment && this.completed));
        }

        get completed(): boolean {
            return this.assessmentResponse?.completed === true
        }

        get showSpinner(): boolean {
            return this.resultsLoading || this.loading
        }

        get coreValues(): CoreValue[] {
            return this.assessmentResponse?.results?.values ?? this.existingResults?.results?.values ?? [];
        }

        async register(id?: string | null, displayName?: string | null, tier?: SubscriptionTier | null): Promise<string> {
            window.clearTimeout(this.initTimeout ?? undefined);
            logger.info(`Registered iOS app for user ${ id }`)

            if (!id) {
                this.error = "Oops, we are unable to load the Core Values assessment. Please try again later";
                return "You must pass a member ID";
            }

            this.appMemberId = id;
            this.appDisplayName = displayName ?? "";
            this.appSubscriptionTier = tier ?? SubscriptionTier.BASIC;
            this.appRegistered = true;
            setUserId(id)

            if (this.isPlusMember) {
                this.existingResults = await this.loadCurrentResults();
            } else {
                this.showAssessment = true;
            }

            this.initAssessment(id);
            this.loading = false

            return "success"
        }

        async updateMember(id?: string | null, displayName?: string | null, tier?: SubscriptionTier | null): Promise<string> {
            logger.info("updating member", id, displayName, tier);
            if (isPremiumTier(tier) && !isPremiumTier(this.appSubscriptionTier) && this.isUpgrading) {
                this.showAssessment = false;
                this.isUpgrading = false;
            }
            this.appSubscriptionTier = tier ?? SubscriptionTier.BASIC;
            return "success";
        }

        initAssessment(memberId: string) {
            this.assessment = CoreValuesAssessment.default();

            this.assessmentResponse = CoreValuesAssessmentResponse.create({
                version: this.assessment.version,
                memberId: memberId,
            });
        }

        restart() {
            this.previousResults = this.existingResults ?? this.previousResults;
            this.existingResults = null;
            this.initAssessment(this.appMemberId!)
            this.showAssessment = true;
        }

        async close() {
            logger.info("Closing assessment....");
            const { error } = IosAppService.closeCoreValues();
            if (error) {
                this.error = "Oops, unable to exit the assessment. " + error;
            }
            this.existingResults = this.previousResults;
        }

        async upgrade() {
            this.isUpgrading = true;
            IosAppService.showPricing();
        }

        async complete(assessmentResponse: CoreValuesAssessmentResponse) {
            logCoreValuesAssessmentCompleted();
            assessmentResponse.completed = true;
            assessmentResponse.results = this.assessment.getResults(assessmentResponse);
            this.assessmentResponse = assessmentResponse
            await this.save(assessmentResponse);
            assessmentResponse.completed = true;

            if (this.isPlusMember) {
                this.showAssessment = false;
            } else {
                await this.upgrade()
            }
        }

        get isPlusMember(): boolean {
            return isPremiumTier(this.appSubscriptionTier);
        }

        async loadCurrentResults(): Promise<CoreValuesAssessmentResponse | null> {
            this.resultsLoading = true;
            const memberId = this.appMemberId;
            if (!memberId) {
                this.resultsLoading = false;
                this.error = "You must be signed in to complete the assessment.";
                return null
            }
            const currentResults = await AssessmentResponseService.sharedInstance.getLatestForUser(memberId);

            this.resultsLoading = false;
            return currentResults ?? null;
        }

        async save(assessmentResponse: CoreValuesAssessmentResponse) {
            const saved = await AssessmentResponseService.sharedInstance.save(assessmentResponse);
            if (saved) {
                this.assessmentResponse = saved;
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "assessment";

    .debug {
        overflow: scroll;
        overflow-scrolling: touch;

        white-space: pre-line;

        pre {
            white-space: pre-line;
        }
    }

    .loader {
        padding: 3rem;
    }

    .retakeBtn {
        margin: -1.6rem 2.4rem 2.4rem;
        width: calc(100% - 4.8rem);

        @include r(600) {
            display: block;
            margin: 0 0 4rem 3.2rem;
        }
    }
</style>