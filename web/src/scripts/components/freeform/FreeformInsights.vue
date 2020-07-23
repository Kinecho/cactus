<template>
    <div>
        <spinner v-if="loading" message="Gathering insights..."/>
        <template v-if="!loading">
            <positivity-rating :sentiment-score="sentimentScore"/>
            <tone-analysis :original-text="reflection.content.text" :tone-result="toneResult"/>
        </template>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import { Prop } from "vue-property-decorator";
    import ToneAnalysis from "@components/ToneAnalysis.vue";
    import Spinner from "@components/Spinner.vue";
    import { ToneResult } from "@shared/api/ToneAnalyzerTypes";
    import PositivityRating from "@components/PositivityRating.vue";
    import { SentimentScore } from "@shared/api/InsightLanguageTypes";

    @Component({
        components: {
            PositivityRating,
            ToneAnalysis,
            Spinner,
        }
    })
    export default class FreeformInsights extends Vue {
        name = "FreeformInsights";

        @Prop({ type: Object as () => ReflectionResponse, required: false, default: null })
        reflection!: ReflectionResponse|null;

        get loading(): boolean {
            return this.reflection?.mightNeedInsightsUpdate ?? true;
        }

        get toneResult(): ToneResult | null {
            return this.reflection?.toneAnalysis ?? null
        }

        get sentimentScore(): SentimentScore | null {
            return this.reflection?.sentiment?.documentSentiment ?? null
        }

    }
</script>

<style scoped lang="scss">

</style>