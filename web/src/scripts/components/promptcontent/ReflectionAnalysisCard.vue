<template>
    <div class="prompt-content-card">
        <span>analysis card</span>


        <div class="textBox">
            <!-- <p v-if="reflectionResponse.toneAnalysis">
                This is the positivity rating of your note. Write more to reveal different emotions.
            </p> -->
            <p>This is what your note reveals about your emotions.</p>
        </div>
        <spinner v-if="isLoading"/>
        <div class="insightsContainer" v-if="!isLoading && response">
            <positivity-rating :sentiment-score="response.sentiment.documentSentiment"/>
            <tone-analysis :tone-result="response.toneAnalysis"
                    :original-text="response.content.text"
                    :sentences-on-new-line="false"
                    @previous="previous"
            />
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

        get isLoading(): boolean {
            return !this.response || (this.card?.responses?.some(r => r.mightNeedInsightsUpdate) ?? false);
        }

        get response(): ReflectionResponse | null {
            return this.card.responses?.[0] ?? null;
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
    @import "mixins";

    .prompt-content-card {
        padding: 4rem 2.4rem;

        @include r(374) {
            //do not add margin: auto here as it makes the cards jumpy
            padding: 5.6rem 3.2rem;
            width: 100%;
        }
    }
</style>