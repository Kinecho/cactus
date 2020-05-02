<template>
    <div>
        <progress-stepper :current="currentPage" :total="numSteps"/>
        <h1>Gap Analysis Page</h1>
        <assessment :assessment="assessment" @questionChanged="setQuestion"/>
        <results v-if="results" :results="results"/>
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

</style>