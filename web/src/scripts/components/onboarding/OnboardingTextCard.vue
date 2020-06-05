<template>
    <div class="text-card">
        <h1>Card {{card.id}}</h1>
        <markdown-text v-if="markdownText" :source="markdownText"/>
        <img class="image" v-if="card.imageUrl" :src="card.imageUrl" alt="Image"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";

    @Component({
        components: {
            MarkdownText,
        }
    })
    export default class OnboardingTextCard extends Vue {
        name = "OnboardingTextCard.vue";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        get markdownText() {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsight })
        }
    }
</script>

<style scoped lang="scss">
    .text-card {
        padding: 3rem;
    }

    img {
        width: 100%;
        max-width: 30rem;
        align-self: center;
    }
</style>