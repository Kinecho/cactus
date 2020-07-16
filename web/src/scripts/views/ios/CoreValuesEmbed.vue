<template>
    <div v-if="!showResults && assessment && assessmentResponse && !closed">
        <assessment :assessment="assessment"
                :assessmentResponse="assessmentResponse"
                @close="closeAssessment"
                @save="save"
                @completed="complete"/>
    </div>
    <div v-else class="assessment-container">
        <template v-if="showResults">
            <core-value-results
                    :core-values="coreValues"
                    :show-dropdown-menu="false"
                    title="Core Values"
                    :show-description="true"/>
            <button class="secondary retakeBtn" @click="restart">Retake the Assessment</button>
        </template>
        <div v-else-if="showUpgradeRequired">
            <h3>You must be a Cactus Plus member to see your results.</h3>
            <button @click="upgrade">Try it free</button>
        </div>
        <template v-else-if="closed && (!assessmentResponse || !assessmentResponse.completed)">
            <p>You may close this screen.</p>
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
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";

    const logger = new Logger("CoreValuesEmbed");

    @Component({
        components: {
            CoreValueResults,
            Spinner,
            Assessment,
        }
    })
    export default class CoreValuesEmbed extends Vue implements IosDelegate {
        name = "CoreValuesEmbed";

        @Prop({ type: Object as () => CactusMember, required: false, default: null })
        member!: CactusMember | null;

        assessment: CoreValuesAssessment = CoreValuesAssessment.default();
        assessmentResponse: CoreValuesAssessmentResponse | null = null;

        appMemberId!: string;
        appDisplayName!: string;
        appSubscriptionTier: SubscriptionTier | null = null;
        appRegistered: boolean = false;
        loading = true;
        resultsLoading = false;
        initTimeout: number | null = null;
        error: string | null = null;
        closed = false;
        existingResults: CoreValuesAssessmentResponse | null = null;
        previousResults: CoreValuesAssessmentResponse | null = null;

        beforeMount() {
            this.loading = true;
            this.initTimeout = window.setTimeout(() => {
                this.error = "Unable to load the assessment. Please try again later."
                this.loading = false;
            }, 15000)
            window.CactusIosDelegate = this;
            IosAppService.notifyAppMounted();
        }

        destroyed() {
            window.clearTimeout(this.initTimeout ?? undefined);
        }

        get showResults(): boolean {
            return this.isPlusMember && (!!this.existingResults || this.closed && this.assessmentResponse?.completed === true);
        }

        get showUpgradeRequired(): boolean {
            return !this.isPlusMember && this.closed && this.assessmentResponse?.completed === true;
        }

        get showSpinner(): boolean {
            return this.resultsLoading || this.loading
        }

        get coreValues(): CoreValue[] {
            return this.assessmentResponse?.results?.values ?? this.existingResults?.results?.values ?? [];
        }

        async register(id: string, displayName: string, tier: SubscriptionTier): Promise<string> {
            window.clearTimeout(this.initTimeout ?? undefined);
            logger.info(`Registered iOS app for user ${ id }`)
            this.appMemberId = id;
            this.appDisplayName = displayName;
            this.appSubscriptionTier = tier;
            this.appRegistered = true;
            setUserId(id)

            this.existingResults = await this.loadCurrentResults();

            this.initAssessment(id);
            this.loading = false

            // FOR TESTING
            // this.assessmentResponse.results = { values: [CoreValue.Power, CoreValue.Nature, CoreValue.Humor] };
            // this.assessmentResponse.completed = true;

            return "success"
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
            this.closed = false;
        }

        async closeAssessment() {
            logger.info("Closing assessment....");
            this.closed = true;
            this.existingResults = this.previousResults;
        }

        async upgrade() {
            IosAppService.showPricing();
        }

        async complete(assessmentResponse: CoreValuesAssessmentResponse) {
            logCoreValuesAssessmentCompleted();
            assessmentResponse.completed = true;
            assessmentResponse.results = this.assessment.getResults(assessmentResponse);
            this.assessmentResponse = assessmentResponse
            await this.save(assessmentResponse);
            assessmentResponse.completed = true;
            this.closed = true;
        }

        get isPlusMember(): boolean {
            return isPremiumTier(this.appSubscriptionTier);
        }

        async loadCurrentResults(): Promise<GapAnalysisAssessmentResult | undefined> {
            this.resultsLoading = true;
            const memberId = this.appMemberId;
            if (!memberId) {
                this.resultsLoading = false;
                this.error = "You must be signed in to complete the assessment.";
                return
            }
            const currentResults = await AssessmentResponseService.sharedInstance.getLatestForUser(memberId);

            this.resultsLoading = false;
            return currentResults;
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