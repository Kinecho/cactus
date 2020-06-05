<template>
    <div>
        <markdown-text :source="card.text"/>
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

</style>