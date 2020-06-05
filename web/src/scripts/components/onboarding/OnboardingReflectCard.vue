<template>
    <div class="elementReflectContainer">
        <!-- <result-element :element="card.element" :selectable="false" :selected="false" :pulsing="false" :withLabel="false"/> -->
        <svg class="element" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
          <path class="path" fill="none" stroke="#FF99B2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.07718848,33.0659031 C16.9034833,54.199668 20.7179299,20.251021 15.8579151,21.0429343 C10.9979002,21.8348476 13.8625604,37.5930451 19.6773127,37.9894412 C27.6775161,38.5348211 28.0221585,13.1185703 24.5423886,12.1275006 C19.4091615,10.6655114 24.3895721,41.7614486 30.3431156,42.9097293 C36.3335467,44.0651857 38.3505895,18.5270842 34.1893654,16.9067124 C29.4631525,15.0663352 32.4072958,35.8238194 37.147521,38.1746579 C44.9090376,42.0239099 46.864989,20.9520616 43.4838166,19.9890733 C38.3505895,18.5270842 43.573142,45.2571484 50.0771885,28.1235674" transform="rotate(9 28.077 27.513)"/>
        </svg>
        <strong>
            <markdown-text :source="markdownText"/>
        </strong>
        <textarea placeholder="Write something..." v-model="responseText" ref="textInput"/>
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

        @Prop({ type: Boolean, default: true })
        autofocusInput: boolean;
        responseText = ""

        get markdownText(): string | undefined {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsightWord })
        }

        mounted() {
            logger.info("Reflect card mounted");
            if (this.autofocusInput) {
                (this.$refs.textInput as HTMLElement).focus();
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .element {
        height: 16vw;
        margin-left: -1.6rem;
        width: 16vw;

        .path {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 1;
            animation: dash 120s ease-out forwards;
        }
    }

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
