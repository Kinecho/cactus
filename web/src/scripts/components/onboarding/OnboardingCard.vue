<template>
    <div class="onboarding-card">
        <h1>Card {{card.id}}</h1>
        <markdown-text v-if="card.text" :source="card.text"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";

    @Component({
        components: {
            MarkdownText,
        }
    })
    export default class OnboardingCard extends Vue {
        name = "OnboardingCard";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;


    }
</script>

<style scoped lang="scss">
    .onboarding-card {
        border: 4px solid blue;
        padding: 3rem;
    }
</style>