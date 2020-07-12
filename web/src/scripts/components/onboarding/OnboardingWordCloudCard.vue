<template>
    <div class="cloud-card">
        <div class="textBox">
            <markdown-text :source="card.text"/>
        </div>
        <spinner :delay="1500" message="Loading..." v-if="!words"/>
        <word-chart :words="words"
                v-if="words"
                :blurry="false"
                :selectable="true"
                :chart-config="chartConfig"
                @selected="wordSelected"
        />
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";
    import WordChart from "@components/InsightWordChart.vue";
    import { WordBubbleConfig } from "@web/charts/wordBubbles";
    import { InsightWord } from "@shared/api/InsightLanguageTypes";
    import Spinner from "@components/Spinner.vue";

    @Component({
        components: {
            Spinner,
            MarkdownText,
            WordChart,
        }
    })
    export default class OnboardingWordCloudCard extends Vue {
        name = "OnboardingWordCloudCard";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        @Prop({ type: Array as () => InsightWord[], default: [], required: false })
        words!: InsightWord[]

        selectedWord: InsightWord | null = null;

        wordSelected(word: InsightWord | null) {
            this.selectedWord = word;
            this.$emit('selectedWord', word);
        }

        get chartConfig(): Partial<WordBubbleConfig> {
            return { numFillerBubbles: 0 }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .cloud-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            padding: 0 2.4rem;
        }

        @include r(600) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        @include r(600) {
            padding-right: 6.4rem;
            width: 50%;
        }
    }

    .insight-word-chart {
        margin: 0 -2.4rem;
        width: calc(100% + 4.8rem);

        @include r(600) {
            align-self: center;
            margin: 0 auto;
            max-width: 50%;
            width: 100%;
        }
    }

</style>
