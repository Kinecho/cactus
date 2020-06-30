<template>
    <tone-analysis :tone-result="toneResult" :original-text="originalText" :sentences-on-new-line="sentencesOnNewLine"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ToneAnalysis from "@components/ToneAnalysis.vue";
    import { ONBOARDING_DEFAULT_TEXT, ONBOARDING_TONE_RESULTS } from "@shared/util/ToneAnalyzerFixtures";
    import { ToneResult } from "@shared/api/ToneAnalyzerTypes";
    import { Prop } from "vue-property-decorator";

    @Component({
        components: {
            ToneAnalysis
        }
    })
    export default class ToneAnalysisOnboardingPlaceholder extends Vue {
        name = "ToneAnalysisOnboardingPlaceholder";

        @Prop({ type: Boolean, default: false })
        sentencesOnNewLine!: boolean;

        get toneResult(): ToneResult {
            return ONBOARDING_TONE_RESULTS;
        }

        get originalText() {
            return ONBOARDING_DEFAULT_TEXT;
        }

    }
</script>

<style scoped lang="scss">

</style>