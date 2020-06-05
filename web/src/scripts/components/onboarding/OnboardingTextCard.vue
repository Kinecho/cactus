<template>
    <div class="text-card">
        <div class="textBox">
            <markdown-text v-if="markdownText" :source="markdownText"/>
        </div>
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

        @Prop({ type: String, required: false, default: null })
        selectedInsight!: string | null;

        get markdownText() {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsight })
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .text-card {
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
            width: 66%;
        }
    }

    .image {
        max-width: 30rem;
        width: 100%;

        @include r(600) {
            align-self: center;
            max-width: 33%;
        }
    }
</style>
