<template>
    <div>
        <result-element :element="card.element" :selectable="false" :selected="false" :pulsing="false"/>
        <markdown-text :source="card.text"/>
        <textarea v-model="responseText"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import MarkdownText from "@components/MarkdownText.vue";
    import Logger from "@shared/Logger"
    import ResultElement from "@components/gapanalysis/ResultElement.vue";

    const logger = new Logger("OnboardingReflectCard");

    @Component({
        components: {
            ResultElement,
            MarkdownText,
        }
    })
    export default class OnboardingReflectCard extends Vue {
        name = "OnboardingReflectCard";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        responseText = ""

    }
</script>

<style scoped lang="scss">

</style>