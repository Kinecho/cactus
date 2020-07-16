<template>
    <div class="coreValuesPage inProgress">
        <div class="centered">
            <router-view :member="this.member"/>
        </div>

    </div>
    <!--    <div class="coreValuesPage" :class="{inProgress: assessmentInProgress}">-->
    <!--        <confetti :running="showConfetti"/>-->
    <!--        <div class="centered">-->
    <!--            <h1 v-if="!assessmentInProgress">Core Values</h1>-->
    <!--            <div v-if="errorMessage" class="alert error">-->
    <!--                {{errorMessage}}-->
    <!--            </div>-->
    <!--            <div v-if="resultsLoading || (embed && !appRegistered)">-->
    <!--                <spinner message="Loading..."/>-->
    <!--            </div>-->
    <!--            <template v-else-if="assessmentInProgress && assessment && assessmentResponse">-->
    <!--                <assessment :assessment="assessment" :assessmentResponse="assessmentResponse" @close="closeAssessment" @save="save" @completed="complete"/>-->
    <!--            </template>-->
    <!--            <template v-else>-->
    <!--                <p>Core values are the general expression of what is most important for you, and they help you-->
    <!--                    understand past decisions and make better decisions in the future.</p>-->

    <!--                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration-->
    <!--                    of how your values have been at the heart of past decisions and how they will unlock a happier-->
    <!--                    future. Your core values results will guide your Cactus reflections.</p>-->

    <!--                <button v-if="plusUser" class="primaryBtn" @click="startNewAssessment" :disabled="creatingAssessment">-->
    <!--                    Take the-->
    <!--                    Assessment-->
    <!--                </button>-->
    <!--                <button v-if="!plusUser" class="primaryBtn" @click="goToPricing">Upgrade</button>-->
    <!--            </template>-->
    <!--        </div>-->
    <!--    </div>-->
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import CactusMember from '@shared/models/CactusMember'
    import { PageRoute } from '@shared/PageRoutes'
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import { isBlank } from "@shared/util/StringUtil";
    import Assessment from "@components/corevalues/Assessment.vue";
    import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
    import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
    import AssessmentResponseService from "@web/services/AssessmentResponseService";
    import Logger from "@shared/Logger";
    import { CoreValueMeta, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import Spinner from "@components/Spinner.vue";
    import { logCoreValuesAssessmentCompleted, logCoreValuesAssessmentStarted } from "@web/analytics";
    import { pushRoute } from "@web/NavigationUtil";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";

    const logger = new Logger("CoreValuesPage");

    @Component({
        components: {
            NavBar,
            Footer,
            Assessment,
            Confetti: () => import("@components/CactusConfetti.vue"),
            Spinner,
        }
    })
    export default class CoreValuesPage extends Vue {

        @Prop({ type: Object as () => CactusMember, required: false, default: null })
        member!: CactusMember | null;

        embed: boolean = false;
        resultsLoading: boolean = false;
        creatingAssessment: boolean = false;
        showConfetti: boolean = false;
        assessmentInProgress: boolean = false;
        // member: CactusMember | null | undefined,
        // memberObserver: ListenerUnsubscriber | null,
        assessment: CoreValuesAssessment = CoreValuesAssessment.default();
        assessmentResponse: CoreValuesAssessmentResponse | null = null;
        assessmentResponseObserver: ListenerUnsubscriber | null = null
        newAssessmentAvailable: boolean = false;
        appRegistered: boolean = false;
        appDisplayName: string | null = null;
        errorMessage: string | null = null;
        appMemberId: string | null = null;
        appSubscriptionTier: SubscriptionTier | null = null;

        mounted(): void {

        }

        async beforeMount() {
            this.embed = !isBlank(getQueryParam(QueryParam.EMBED))
            if (this.$route.path === PageRoute.CORE_VALUES_EMBED || this.$route.path === PageRoute.CORE_VALUES_ASSESSMENT) {
                return;
            }
            if (this.embed) {
                await pushRoute(PageRoute.CORE_VALUES_EMBED);
                return;
            } else {
                await pushRoute(PageRoute.CORE_VALUES_ASSESSMENT)
                return;
            }
        }


        async closeAssessment() {
            this.assessmentInProgress = false;
            await this.loadCurrentResults();
            this.resultsLoading = false
        }

        async loadCurrentResults() {
            this.resultsLoading = true;
            const memberId = this.member?.id ?? this.appMemberId;
            if (!memberId) {
                this.resultsLoading = false;
                return
            }
            const currentResults = await AssessmentResponseService.sharedInstance.getLatestForUser(memberId);
            if (currentResults) {
                this.assessmentResponse = currentResults;
                if (currentResults.assessmentVersion.localeCompare(this.assessment.version) < 0) {
                    this.newAssessmentAvailable = true;
                }
            }
            this.resultsLoading = false;
        }

        goToPricing() {
            this.errorMessage = null
            if (this.embed) {
                try {
                    window.webkit.messageHandlers.showPricing.postMessage(true);
                } catch (error) {
                    this.errorMessage = error.message ?? "Unable to open the pricing page."
                    logger.error("Failed to post message to webkit");
                }

            } else {
                pushRoute(`${ PageRoute.PRICING }?${ QueryParam.CORE_VALUES }=true`);
            }
        }

        async complete(assessmentResponse: CoreValuesAssessmentResponse) {
            logCoreValuesAssessmentCompleted();
            assessmentResponse.completed = true;
            // const assessmentResponse = this.assessmentResponse;
            // assessmentResponse.completed = true;
            assessmentResponse.results = this.assessment.getResults(assessmentResponse);
            // response.results = { values: [CoreValue.Power, CoreValue.Nature, CoreValue.Humor] };
            this.assessmentResponse = assessmentResponse
            await this.save(assessmentResponse);
            assessmentResponse.completed = true;
            this.assessmentInProgress = false;
            setTimeout(() => {
                this.showConfetti = true
            }, 100);
        }

        async save(assessmentResponse: CoreValuesAssessmentResponse) {
            const saved = await AssessmentResponseService.sharedInstance.save(assessmentResponse);
            if (saved) {
                this.assessmentResponse = saved;
            }
        }

        async startNewAssessment() {
            const assessment = this.assessment;
            this.resultsLoading = true;
            const version = assessment.version;
            const memberId = this.member?.id ?? this.appMemberId;
            if (!memberId) {
                logger.error("No member id was found, can't create assessment");
                return;
            }

            const response = CoreValuesAssessmentResponse.create({ version, memberId });
            const updatedResponse = await AssessmentResponseService.sharedInstance.save(response);
            logCoreValuesAssessmentStarted();
            this.assessmentResponseObserver = AssessmentResponseService.sharedInstance.observeById(updatedResponse!.id!, {
                onData: response => {
                    if (response) {
                        this.assessmentResponse = response;
                    }
                    this.resultsLoading = false;
                    this.assessmentInProgress = true;
                }
            });
        }


        hasValues(): boolean {
            return (this.assessmentResponse?.completed ?? false) && (this.assessmentResponse?.results?.values ?? []).length > 0;
        }

        get valuesResultBlob(): { imageUrl: string, backgroundColor: string } | null {
            let results = this.coreValueResults
            if (!this.hasValues || !results) {
                return null
            }
            const forceIndex = getQueryParam(QueryParam.BG_INDEX);

            return this.assessmentResponse?.getBlob(forceIndex) ?? null
        }

        get blobImageUrl(): string | null {
            return this.valuesResultBlob?.imageUrl ?? null
        }

        get cardBgColor(): Record<string, string> | null {
            const color = this.valuesResultBlob?.backgroundColor
            if (color) {
                return {
                    backgroundColor: color,
                };
            }
            return null;
        }

        get coreValueResults(): CoreValueMeta[] | undefined {
            let values = this.assessmentResponse?.results?.values;
            if (!values) {
                return undefined;
            }
            return values.map(v => CoreValuesService.shared.getMeta(v));
        }

        get plusUser(): boolean {
            const tier = this.member?.tier ?? this.appSubscriptionTier ?? SubscriptionTier.BASIC;
            return tier === SubscriptionTier.PLUS
        }

        get displayName(): string {
            if (this.embed && this.appDisplayName) {
                return this.appDisplayName;
            }

            return !isBlank(this.member?.firstName) ? this.member?.firstName ?? "" : this.member?.getFullName() ?? ""
        }

    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .coreValuesPage {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;
        position: relative;

        &.inProgress {
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

            .centered {
                padding: 0;
                position: relative;
                z-index: 1;
            }
        }

        header, .centered {
            width: 100%;
        }

        .centered {
            flex-grow: 1;
            max-width: 768px;
            padding: 0 2.4rem 6.4rem;
            text-align: left;
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

    .inProgress h1 {
        display: none;

        @include r(768) {
            display: block;
        }
    }

    .primaryBtn {
        display: block;
        margin-top: 2.4rem;
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .coreValuesCard {
        @include shadowbox;
        background-color: darken($royal, 6%);
        background-image: url(/assets/images/grainy.png);
        color: white;
        margin: 1.6rem auto 2.4rem;
        max-width: fit-content;
        padding: 2.4rem 0;
        text-align: center;
        width: auto;

        @include r(768) {
            margin: 3.2rem 0;
        }

        .flexContainer {
            display: flex;
        }

        .cvName {
            padding-right: .4rem;
        }

        h3 {
            margin-bottom: 1.6rem;
        }
    }

    .valuesList {
        align-self: center;
        list-style: none;
        margin: 0 0 0 1.6rem;
        padding: 0 1.6rem 0 0;
        text-align: center;
        width: 50%;

        li {
            font-size: 1.4rem;
            font-weight: bold;
            letter-spacing: 1px;
            list-style: none;
            margin: 0 0 .8rem;
            opacity: .8;
            padding: 0;
            text-transform: uppercase;

            &:last-child {
                margin-bottom: 0;
            }
        }
    }

    .cvBlobContainer {
        align-self: flex-start;
        height: auto;
        margin-bottom: -3.2rem;
        max-width: 20rem;
        transform: translate(-.8rem);
        width: 50%;

        .cvBlob {
            width: 100%;
            height: 100%;
        }
    }


    button.small {
        display: flex;
        margin: 0 auto;

        @include r(768) {
            margin: 0;
        }
    }

    .fancyLink {
        @include fancyLink;
        font-weight: bold;
    }

    .extraPadding {
        margin-top: 6.4rem;
    }

</style>
