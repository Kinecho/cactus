<template>
    <div class="cloud-card">
        <div class="textBox">
            <markdown-text :source="card.text"/>
        </div>
        <word-chart :words="words" :blurry="false"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";
    import { InsightWord } from "@shared/models/ReflectionResponse";
    import WordChart from "@components/InsightWordChart.vue";

    @Component({
        components: {
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
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .cloud-card {
        padding: 0 2.4rem;

        @include r(600) {
            align-items: center;
            display: flex;
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
        width: 100%;

        @include r(600) {
            align-self: center;
            max-width: 50%;
        }
    }

</style>
