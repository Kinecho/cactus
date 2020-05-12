<template>
    <div class="gapAnalysisPage">
        <div class="centered">
            <div class="sign-in" v-if="!member && memberLoaded">
                <sign-in :show-magic-link="false"
                        :show-title="true"
                        title="Mental Fitness Quiz"
                        message="Sign in to continue to your quiz."
                        :sign-in-success-path="signInSuccessRoute"
                        :redirect-on-sign-in="false"
                        :redirect-url="signInSuccessRoute"
                        :twitterEnabled="false"
                />
            </div>
            <assessment v-if="member && memberLoaded"
                    :assessment="assessment"
                    @questionChanged="setQuestion"
                    :include-upsell="includeUpsell"
                    @close="closeAssessment"
                    @finished="finishAssessment"/>
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
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import CactusMemberService from "@web/services/CactusMemberService";
    import GapAnalysisService from "@web/services/GapAnalysisService";
    import SignIn from "@components/SignIn.vue";
    import LoadingPage from "@web/views/LoadingPage.vue";
    import { isPremiumTier } from "@shared/models/MemberSubscription";

    const logger = new Logger("GapAnalysisPage");

    @Component({
        components: {
            LoadingPage,
            Results,
            SignIn,
            Assessment,
            ProgressStepper,
        }
    })
    export default class GapAnalysisPage extends Vue {
        assessmentId: string | null = null;
        assessment = GapAnalysisAssessment.create();
        latestResults: GapAnalysisAssessmentResult | undefined = undefined;
        currentPage: number = 0;
        memberLoaded = false;
        memberUnsubscriber?: ListenerUnsubscriber;
        member: CactusMember | undefined | null = null;

        async beforeMount() {

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({ member }) => {
                    this.member = member;
                    this.memberLoaded = true;
                    // if (!member) {
                    //     pushRoute(`${ PageRoute.SIGNUP }?${ QueryParam.MESSAGE }=${ encodeURIComponent("Please sign in to take the assessment") }`);
                    // }
                }
            })
        }

        get signInSuccessRoute() {
            return PageRoute.GAP_ANALYSIS;
        }

        get results(): GapAnalysisAssessmentResult | undefined {
            return this.latestResults;
        }

        get numSteps(): number {
            return this.assessment.questions.length;
        }

        async saveResults(results: GapAnalysisAssessmentResult) {
            logger.info("Saving results of assessment...");
            this.latestResults = results;
        }

        get includeUpsell(): boolean {
            return !isPremiumTier(this.member?.tier);
        }

        setQuestion(questionIndex: number) {
            this.currentPage = questionIndex;
        }

        async closeAssessment() {
            logger.info("CLOSE ASSESSMENT");
            try {
                if (this.member) {
                    await pushRoute(PageRoute.INSIGHTS)
                } else {
                    await pushRoute(PageRoute.HOME);
                }
            } catch (error) {
                logger.error("Failed to navigate to route, navigating home");
                await pushRoute(PageRoute.HOME);
            }
        }

        async finishAssessment(results: GapAnalysisAssessmentResult) {
            logger.info("FINISH ASSESSMENT gap results", results);
            try {
                results.setCompleted()
                if (this.member) {
                    results.memberId = this.member?.id;
                }

                await GapAnalysisService.sharedInstance.save(results);

            } catch (error) {
                logger.error(`Failed to save gap results for member ${ this.member?.id }`, error);
            }
            // if (!this.member) {
            //     await pushRoute(PageRoute.PRICING);
            // } else {
            //     await pushRoute(PageRoute.INSIGHTS);
            // }
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

        &:after {
            background-image: url(assets/images/crosses2.svg),
            url(assets/images/outlineBlob.svg),
            url(assets/images/royalBlob.svg),
            url(assets/images/pinkBlob5.svg);
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
                background-image: url(assets/images/grainy.png),
                url(assets/images/crosses2.svg),
                url(assets/images/outlineBlob.svg),
                url(assets/images/royalBlob.svg),
                url(assets/images/pinkBlob5.svg);
                background-position: 0 0,
                -1rem -1rem,
                -59rem -26rem,
                -15rem 34rem,
                70rem -90rem;
                background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;
                background-size: auto, auto, 110%, 100%, 100%;
            }
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
        @include shadowbox;
        padding: 3rem;
    }

</style>
