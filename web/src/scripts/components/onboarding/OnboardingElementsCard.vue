<template>
    <div class="elements-card">
        <div class="textBox">
            <markdown-text :source="card.text"/>
        </div>
        <elements/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import MarkdownText from "@components/MarkdownText.vue";
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import Elements from "@components/ElementsOverview.vue";

    @Component({
        components: {
            MarkdownText,
            Elements,
        }
    })
    export default class OnboardingElementsCard extends Vue {
        name = "OnboardingElementsCard";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .elements-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            padding: 0 2.4rem;
        }

        @include r(768) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        @include r(768) {
            padding-right: 6.4rem;
            width: 50%;
        }
    }

    .elements-container {
        margin: 0 -2.4rem;
        width: calc(100% + 4.8rem);

        @include r(768) {
            align-self: center;
            margin: 0 auto;
            max-width: 50%;
            width: 100%;
        }
    }

</style>
