<template>
    <div class="elementReflectContainer">
        <result-element :element="card.element" :selectable="false" :selected="false" :pulsing="false" :withLabel="false"/>
        <strong>
            <markdown-text :source="markdownText"/>
        </strong>
        <textarea placeholder="Write something..." v-model="responseText" autofocus/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
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

        @Prop({ type: String, required: false, default: null })
        selectedInsightWord!: string | null;

        responseText = ""

        get markdownText(): string | undefined {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsightWord })
        }

    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .elementReflectContainer {
        align-self: center;
        padding: 0 4rem;

        @include r(600) {
            padding: 0 6.4rem;
        }
    }

    .element-icon {
        align-items: flex-start;
    }

    strong {
        display: block;
        margin-bottom: .8rem;

        @include r(768) {
            margin-bottom: 1.6rem;
        }
    }

    textarea {
        font-family: $font-stack;
        background: transparent;
        border: 0;
        font-size: 1.8rem;
        width: 100%;

        @include r(374) {
            font-size: 2rem;
        }
        @include r(768) {
            font-size: 2.4rem;
        }
        @include r(960) {
            font-size: 3.2rem;
        }
    }
</style>
