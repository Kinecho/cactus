<template>
    <div class="gapAnalysisPage">
        <div class="centered">
            <h1>Mental Fitness Quiz</h1>
            <assessment :assessment="assessment" @questionChanged="setQuestion" @close="closeAssessment" @finished="finishAssessment"/>
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

    const logger = new Logger("GapAnalysisPage");

    @Component({
        components: {
            Results,
            Assessment,
            ProgressStepper
        }
    })
    export default class GapAnalysisPage extends Vue {
        assessment = GapAnalysisAssessment.create();
        latestResults: GapAnalysisAssessmentResult | undefined = undefined;
        currentPage: number = 0;
        memberUnsubscriber?: ListenerUnsubscriber;
        member?: CactusMember | undefined;

        beforeMount() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({ member }) => {
                    this.member = member;
                }
            })
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

        setQuestion(questionIndex: number) {
            this.currentPage = questionIndex;
        }

        async closeAssessment() {
            try {
                if (this.member) {
                    await pushRoute(PageRoute.INSIGHTS)
                } else {
                    await pushRoute(PageRoute.HOME);
                }
            } catch (error) {
                logger.error("Failed to go back, navigating home");
                await pushRoute(PageRoute.HOME);
            }
        }

        async finishAssessment(results: GapAnalysisAssessmentResult) {
            logger.info("gap results", results);
            if (!this.member) {
                await pushRoute(PageRoute.PRICING);
            } else {
                await pushRoute(PageRoute.INSIGHTS);
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

        @include r(768) {
            background-color: $beige;
        }

        .centered {
            flex-grow: 1;
            max-width: 768px;
            padding: 0;
            position: relative;
            text-align: left;
            z-index: 1;
        }

        header, .centered {
            width: 100%;
        }

        h1 {
            display: none;

            @include r(768) {
                display: block;
                margin: 6.4rem 0 1.6rem;
            }
        }

        p {
            margin-bottom: 1.6rem;
            max-width: 64rem;
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

</style>
