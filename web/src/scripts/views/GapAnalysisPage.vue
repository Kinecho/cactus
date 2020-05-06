<template>
    <div class="coreValuesPage">
        <div class="centered">
            <h1>Mental Fitness Quiz</h1>
            <assessment :assessment="assessment" @questionChanged="setQuestion"/>
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
    }
</script>

<style scoped lang="scss">
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

        &:after {
            background: url(assets/images/cvBlob.png) no-repeat;
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
            background: url(assets/images/pinkVs.svg) no-repeat;
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
