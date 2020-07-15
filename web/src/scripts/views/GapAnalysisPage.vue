<template>
    <div class="gapAnalysisPage" :class="{signin: !member, loading,}">
        <div class="loader" v-if="loading">
            <spinner color="light" message="Loading quiz..." :delay="1200"/>
        </div>
        <div class="centered" v-else>
            <assessment
                    :assessment="assessment"
                    :result="assessmentResults"
                    :include-upsell="includeUpsell"
                    :questionIndex="questionIndex"
                    :currentScreen="currentScreen"
                    :screens="screens"
                    @upsellProductLoaded="upsellProductLoaded"
                    @screen="setScreen"
                    @questionChanged="setQuestion"
                    @close="closeAssessment"
                    @finished="finishAssessment"
            />
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import Assessment from "@components/gapanalysis/Assessment.vue";
    import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import Logger from "@shared/Logger"
    import Results from "@components/gapanalysis/Results.vue";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import { pushRoute } from "@web/NavigationUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import CactusMember from "@shared/models/CactusMember";
    import GapAnalysisService from "@web/services/GapAnalysisService";
    import SignIn from "@components/SignIn.vue";
    import LoadingPage from "@web/views/LoadingPage.vue";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import { Prop, Watch } from "vue-property-decorator";
    import Spinner from "@components/Spinner.vue";
    import { defaultScreens, Screen, ScreenName } from "@components/gapanalysis/GapAssessmentTypes";
    import {
        fireOptInStartTrialEvent,
        logGapAnalysisCanceled,
        logGapAnalysisCompleted,
        logGapAnalysisScreen,
        logGapAnalysisStarted,
        logPresentSubscriptionOffers
    } from "@web/analytics";
    import SubscriptionProduct from "@shared/models/SubscriptionProduct";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import StorageService, { LocalStorageKey } from "@web/services/StorageService";

    const logger = new Logger("GapAnalysisPage");

    @Component({
        components: {
            LoadingPage,
            Spinner,
            Results,
            SignIn,
            Assessment,
            ProgressStepper,
        }
    })
    export default class GapAnalysisPage extends Vue {
        assessment = GapAnalysisAssessment.create();
        latestResults: GapAnalysisAssessmentResult | null = null;
        resultsLoaded = false;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: String, required: false })
        resultsId?: string;

        @Prop({ type: String as () => ScreenName, required: false })
        screen?: ScreenName;

        @Prop({ type: Number, required: false, default: 0 })
        questionIndex!: number;

        currentScreen: ScreenName = Screen.intro;

        @Watch("screen")
        onScreenRoute(screen: ScreenName | undefined | null) {
            if (screen) {
                this.currentScreen = screen;
            }
        }

        @Watch("resultsId")
        onResultsId(newId: string | null | undefined, oldId: string | undefined | null) {
            logger.info("ResultsId changed, ")
            if (newId && newId !== oldId) {
                this.fetchResults(newId);
            }
        }

        async beforeMount() {
            if (this.member) {
                await this.fetchOrCreateResults()
            }
        }

        async mounted() {
            const upgradeSuccess = getQueryParam(QueryParam.UPGRADE_SUCCESS);
            if (upgradeSuccess === "success") {
                let priceDollars = StorageService.getNumber(LocalStorageKey.subscriptionPriceCents);

                if (priceDollars) {
                    priceDollars = priceDollars / 100;
                }
                await fireOptInStartTrialEvent({ value: priceDollars })
            }
        }

        get loading(): boolean {
            return !this.resultsLoaded;
        }

        async upsellProductLoaded(product: SubscriptionProduct | null | undefined) {
            logPresentSubscriptionOffers({
                creativeName: "Gap Analysis Upsell",
                products: [{
                    subscriptionProductId: product?.entryId,
                    name: product?.displayName,
                    billingPeriod: product?.billingPeriod
                }]
            })
        }

        async fetchOrCreateResults() {
            if (this.member) {
                if (this.resultsId) {
                    logger.info("Before mount - results Id = fetching results");
                    await this.fetchResults(this.resultsId);
                } else {
                    await this.createNewResults()
                }
            }
        }

        async createNewResults() {
            const results = GapAnalysisAssessmentResult.create();
            // results.id = GapAnalysisService.sharedInstance.createDocId();
            await GapAnalysisService.sharedInstance.save(results);
            this.latestResults = results;
            logger.info("Saved brand new results on mount. id = ", results.id);
            const id = results.id;
            if (id) {
                logGapAnalysisStarted();
                await pushRoute(`${ PageRoute.GAP_ANALYSIS }/${ id }`);
            }
            this.resultsLoaded = true;
        }

        async fetchResults(resultsId: string | null | undefined) {
            logger.info("Fetching results for id", resultsId);
            if (resultsId) {
                const results = await GapAnalysisService.sharedInstance.getById(resultsId)
                logger.info(`Got latest results for id ${ resultsId }`, results);
                if (results) {
                    this.latestResults = results;
                    this.resultsLoaded = true;
                }

                if (this.screen) {
                    this.currentScreen = this.screen;
                }
            } else {
                this.resultsLoaded = true;
            }
        }

        setScreen(screen: ScreenName) {
            if (this.resultsId) {
                if (screen === Screen.questions) {
                    logGapAnalysisScreen(screen, this.questionIndex);
                    pushRoute(`${ PageRoute.GAP_ANALYSIS }/${ this.resultsId }/${ screen }/${ this.questionIndex }`);
                } else {
                    logGapAnalysisScreen(screen);
                    pushRoute(`${ PageRoute.GAP_ANALYSIS }/${ this.resultsId }/${ screen }`);
                }
            } else {
                this.currentScreen = screen;
            }
        }

        get signInSuccessRoute() {
            return PageRoute.GAP_ANALYSIS;
        }

        get assessmentResults(): GapAnalysisAssessmentResult | undefined {
            if (this.resultsLoaded) {
                return this.latestResults ?? GapAnalysisAssessmentResult.create();
            }
            return GapAnalysisAssessmentResult.create();
        }

        get includeUpsell(): boolean {
            return !this.isPlusMember;
        }

        get isPlusMember(): boolean {
            return !!this.member && isPremiumTier(this.member?.tier);
        }

        get screens(): ScreenName[] {
            return [...defaultScreens].filter(screen => {
                return !(screen === Screen.upgrade && !this.includeUpsell);
            })
        }

        async setQuestion(questionIndex: number) {
            if (this.currentScreen === Screen.questions && this.resultsId && questionIndex !== this.questionIndex) {
                if (this.latestResults) {
                    await GapAnalysisService.sharedInstance.save(this.latestResults);
                }
                await pushRoute(`${ PageRoute.GAP_ANALYSIS }/${ this.resultsId }/${ Screen.questions }/${ questionIndex }`);
            }
        }

        async closeAssessment() {
            if (this.assessmentResults?.completed !== true) {
                logGapAnalysisCanceled(this.screen);
            }

            try {
                if (this.member) {
                    await pushRoute(PageRoute.MEMBER_HOME);
                } else {
                    await pushRoute(PageRoute.HOME);
                }
            } catch (error) {
                logger.error("Failed to navigate to route, navigating home");
                await pushRoute(PageRoute.HOME);
            }
        }

        async finishAssessment(results: GapAnalysisAssessmentResult) {
            try {
                results.setCompleted()
                logGapAnalysisCompleted();
                if (this.member) {
                    results.memberId = this.member?.id;
                }

                await GapAnalysisService.sharedInstance.save(results);
            } catch (error) {
                logger.error(`Failed to save gap results for member ${ this.member?.id }`, error);
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";


    .gapAnalysisPage {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;
        position: relative;

        &.loading {
            color: $white;
            justify-content: center;
            align-items: center;

            .loader {
                z-index: 1;
            }
        }

        &:after {
            background-image: url(/assets/images/crosses2.svg),
            url(/assets/images/outlineBlob.svg),
            url(/assets/images/royalBlob.svg),
            url(/assets/images/pinkBlob5.svg);
            background-position: -11rem 38rem, right -11rem top -35rem, -21rem 41rem, 50% -143px;
            background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
            background-size: 20rem, 48rem, 30rem, 23rem;
            content: "";
            display: block;
            height: 100%;
            left: 0;
            overflow: hidden;
            position: absolute;
            top: 0;
            width: 100%;

            @include r(768) {
                background: lighten($dolphin, 16%);
                background-image: url(/assets/images/grainy.png),
                url(/assets/images/crosses2.svg),
                url(/assets/images/outlineBlob.svg),
                url(/assets/images/royalBlob.svg),
                url(/assets/images/pinkBlob5.svg);
                background-position: 0 0,
                -1rem -1rem,
                -59rem -26rem,
                -15rem 34rem,
                70rem -70rem;
                background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;
                background-size: auto, auto, 110%, 100%, 120rem;
            }
        }

        &.signin {
            background: lighten($dolphin, 16%);
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
    }

    .sign-in {
        align-items: center;
        color: $white;
        display: flex;
        min-height: 100vh;
        padding: 0 2.4rem;

        /*.centered {*/
        text-align: center;
        /*}*/

        /*position: relative;*/
        justify-content: center;
        z-index: 1;
        /*padding: 6.4rem 2.4rem 0;*/

        @include r(600) {
            padding: 12rem 0 0;
        }
    }

</style>
