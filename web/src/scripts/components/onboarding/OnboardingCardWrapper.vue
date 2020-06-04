<template>
    <div class="card-wrapper">
        <component class="content" :is="cardType" :card="card"></component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { CardType, OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import PhotoCard from "@components/onboarding/OnboardingPhotoCard.vue";
    import TextCard from "@components/onboarding/OnboardingTextCard.vue";
    import ReflectCard from "@components/onboarding/OnboardingReflectCard.vue";

    @Component({
        components: {
            TextCard,
            PhotoCard,
            ReflectCard,
        }
    })
    export default class OnboardingCardWrapper extends Vue {
        name = "OnboardingCardWrapper";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        get cardType(): string {
            switch (this.card.type) {
                case CardType.text:
                    return "text-card";
                case CardType.photo:
                    return "photo-card";
                case CardType.reflect:
                    return "reflect-card";
                default:
                    return "text-card";
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .card-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex: 1;
    }

    .content {
        border: 4px solid blue;
        width: 100%;

        @include r(600) {
            max-width: 70rem;
        }

    }
</style>