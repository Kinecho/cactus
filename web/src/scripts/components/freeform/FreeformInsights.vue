<template>
    <div class="freeformInsights">
        <spinner v-if="loading" message="Gathering insights..."/>
        <div class="textBox" v-if="!loading">
            <p>This is what your note reveals about your emotions.</p>
        </div>
        <div class="insightsContainer" v-if="!loading">
            <positivity-rating :sentiment-score="sentimentScore"/>
            <tone-analysis :original-text="reflection.content.text" :tone-result="toneResult"/>
        </div>
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
    @import "mixins";

    .freeformInsights {
        display: flex;
        flex-flow: column nowrap;
        padding: 6.4rem 2.4rem;
        width: 100%;

        @include r(768) {
            height: 100%;
            justify-content: center;
            margin: 0 auto;
            max-width: 110rem;
            padding: 2.4rem;
        }
        @include r(960) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
        }
    }

    .textBox {
        font-size: 2rem;
        margin-bottom: 3.2rem;

        @include r(374) {
            font-size: 2.4rem;
        }
        @include r(600) {
            margin: 0 auto 3.2rem;
            max-width: 60rem;
            width: 100%;
        }
        @include r(768) {
            font-size: 3.2rem;
        }
        @include r(960) {
            font-size: 4rem;
            margin-bottom: 0;
            padding-right: 6.4rem;
            width: 50%;
        }
    }

    .insightsContainer {
        font-size: 1.8rem;
        width: 100%;

        @include r(600) {
            margin: 0 auto;
            max-width: 60rem;
        }
        @include r(960) {
            align-self: center;
            font-size: 2rem;
            max-width: 50%;
        }
    }

    .spinner-container {
        flex-grow: 1;
    }

</style>