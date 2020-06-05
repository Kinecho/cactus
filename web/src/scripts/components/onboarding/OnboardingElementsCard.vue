<template>
    <div>
        <markdown-text :source="card.text"/>
        <elements/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import MarkdownText from "@components/MarkdownText.vue";
    import { OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import Elements from "@components/PromptContentCardElements.vue";

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

</style>