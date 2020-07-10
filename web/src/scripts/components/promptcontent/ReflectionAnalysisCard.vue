<template>
    <div class="prompt-content-card">
        <div class="centered timeout-error" v-if="hasText && timedOut && !isLoading">
            <p>Looks like we were unable to load your insights. Please try again later.</p>
        </div>
        <div class="centered" v-if="isLoading">
            <spinner class="loading" message="Gathering insights..."/>
        </div>
        <div class="analysis-card">
            <template v-if="!isLoading">
                <div class="textBox">
                    <p v-if="hasText">This is what your note reveals about your emotions.</p>
                </div>
                <div class="analysisContainer">
                    <positivity-rating :sentiment-score="documentSentiment"/>
                    <tone-analysis :tone-result="toneAnalysis"
                            :original-text="reflectionText"
                            :sentences-on-new-line="false"
                            @previous="previous"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import MarkdownText from "@components/MarkdownText.vue";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import PositivityRating from "@components/PositivityRating.vue";
    import ToneAnalysis from "@components/ToneAnalysis.vue";
    import Spinner from "@components/Spinner.vue";
    import Timeout = NodeJS.Timeout;
    import { SentimentScore } from "@shared/api/InsightLanguageTypes";
    import { ToneResult } from "@shared/api/ToneAnalyzerTypes";
    import { isBlank } from "@shared/util/StringUtil";

    const timeout_ms = 20000; // 20 seconds;

    @Component({
        components: {
            MarkdownText,
            PositivityRating,
            ToneAnalysis,
            Spinner
        }
    })
    export default class ReflectionAnalysisCard extends Vue {
        name = "ReflectionAnalysisCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

        timedOut = false;
        timerTimeout: Timeout | null = null;

        get isLoading(): boolean {
            return this.hasText && !this.timedOut && this.analysisLoading;
        }

        get analysisLoading(): boolean {
            return !this.response || (this.card?.responses?.some(r => r.mightNeedInsightsUpdate) ?? false)
        }

        get response(): ReflectionResponse | null {
            return this.card.responses?.[0] ?? null;
        }

        get documentSentiment(): SentimentScore | null {
            return this.hasText ? this.response?.sentiment?.documentSentiment ?? null : null;
        }

        get toneAnalysis(): ToneResult | null {
            return this.hasText ? this.response?.toneAnalysis ?? null : null;
        }

        get reflectionText(): string | null {
            return this.response?.content.text ?? null;
        }

        get hasText(): boolean {
            return !isBlank(this.reflectionText);
        }

        mounted() {
            this.timerTimeout = setTimeout(() => {
                if (this.analysisLoading) {
                    this.timedOut = true;
                }
            }, timeout_ms);
        }

        destroyed() {
            if (this.timerTimeout) {
                clearTimeout(this.timerTimeout);
            }
        }

        next() {
            this.$emit('next');

        }

        previous() {
            this.$emit("previous");

        }


    }
</script>

<style scoped lang="scss">
    @import "prompts";
    @import "mixins";

    .timeout-error {
        font-size: 2.4rem;
        max-width: 56rem;
        padding: 6.4rem 0;
    }

    .analysis-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 80vh;
        padding: 2.4rem 1.6rem;

        @include r(960) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
        }

        &:empty {
            display: none;
        }
    }

    .textBox {
        margin-bottom: 3.2rem;

        @include r(600) {
            margin: 0 auto 3.2rem;
            max-width: 60rem;
            width: 100%;
        }
        @include r(960) {
            margin-bottom: 0;
            padding-right: 6.4rem;
            width: 50%;
        }

        &:empty {
            display: none;
        }
    }

    .analysisContainer {
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

    .loading {
        font-size: 1.8rem;
    }
</style>