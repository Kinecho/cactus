<template>
    <div v-touch:swipe="handleSwipeEvent" class="prompt-content-main" :class="`index-${index}`">
        <progress-stepper :total="totalPages" :current="contentIndex" class="progress"/>
        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="card-container">
            <component
                    v-for="(card, i) in cards"
                    v-if="i === index"
                    :is="getCardType(card)"
                    :card="card"
                    :index="i"
                    :key="`card_${i}`"
                    @next="next"
                    @previous="previous"
            />
        </transition-group>

        <button aria-label="Previous slide" @click="previous" :disabled="!previousEnabled" class="arrow previous tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>
        <button v-if="showNextButton" aria-label="Next slide" :disabled="!nextEnabled" @click="next" class="arrow next tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContent, { ContentType } from "@shared/models/PromptContent";
    import { Prop } from "vue-property-decorator";
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import CactusMember from "@shared/models/CactusMember";
    import Logger from "@shared/Logger"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import TextCard from "@components/promptcontent/TextCard.vue";
    import PhotoCard from "@components/promptcontent/PhotoCard.vue";
    import ReflectCard from "@components/promptcontent/ReflectCard.vue";
    import QuoteCard from "@components/promptcontent/QuoteCard.vue";
    import VideoCard from "@components/promptcontent/VideoCard.vue";
    import ReflectionAnalysisCard from "@components/promptcontent/ReflectionAnalysisCard.vue";

    const logger = new Logger("PromptContent");

    const transitionName = {
        next: "slide-left-absolute",
        previous: "slide-right-absolute"
    }

    enum CardType {
        text = "text-card",
        photo = "photo-card",
        quote = "quote-card",
        reflect = "reflect-card",
        video = "video-card",
        reflection_analysis = "reflection-analysis-card",
    }

    @Component({
        components: {
            [CardType.text]: TextCard,
            [CardType.photo]: PhotoCard,
            [CardType.reflect]: ReflectCard,
            [CardType.quote]: QuoteCard,
            [CardType.video]: VideoCard,
            [CardType.reflection_analysis]: ReflectionAnalysisCard,
            ProgressStepper,
        }
    })
    export default class PromptView extends Vue {
        name = "PromptContent.vue";

        @Prop({ type: Object as () => PromptContent, required: true })
        promptContent!: PromptContent

        @Prop({ type: Object as () => ReflectionPrompt, required: true })
        prompt!: ReflectionPrompt;

        @Prop({ type: Array as () => ReflectionResponse[], required: false, default: null })
        responses!: ReflectionResponse[] | null;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        /**
         * Zero-based index of the current card to show
         */
        @Prop({ type: Number, required: false, default: 0 })
        index!: number;

        @Prop({type: Array as () => PromptContentCardViewModel[], required: true, default: []})
        cards!: PromptContentCardViewModel[]

        cardTransitionName = transitionName.next;
        keyListener: any = null;
        keyboardNavigationEnabled = true;

        mounted() {
            this.keyListener = document.addEventListener("keyup", this.handleDocumentKeyUp)
        }

        destroyed() {
            document.removeEventListener("keyup", this.handleDocumentKeyUp);
        }

        getCardType(card: PromptContentCardViewModel): CardType {
            switch (card.type) {
                case ContentType.text:
                    return CardType.text;
                case ContentType.photo:
                    return CardType.photo;
                case ContentType.reflect:
                    return CardType.reflect;
                case ContentType.quote:
                    return CardType.quote;
                case ContentType.video:
                    return CardType.video;
                case ContentType.reflection_analysis:
                    return CardType.reflection_analysis;
                case ContentType.audio:
                case ContentType.elements:
                case ContentType.share_reflection:
                case ContentType.invite:
                default:
                    return CardType.text;
            }
        }

        /**
         * Ensure the index is within the bounds of the content array
         * @return {number}
         */
        get contentIndex(): number {
            return Math.min(Math.max(this.index, 0), this.cards.length - 1);
        }

        get totalPages(): number {
            return this.promptContent.content.length;
        }

        get showNextButton(): boolean {
            return this.nextEnabled;
        }

        get nextEnabled(): boolean {
            const hasNextCard = this.index < this.cards.length - 1;
            logger.info("Has next card: ", true);
            return hasNextCard;
        }

        get previousEnabled(): boolean {
            return this.index > 0;
        }

        next() {
            if (this.nextEnabled) {
                this.cardTransitionName = transitionName.next;
                this.$emit('next');
            }
        }

        previous() {
            if (this.previousEnabled) {
                this.cardTransitionName = transitionName.previous;
                this.$emit("previous");
            }
        }

        handleDocumentKeyUp(event: KeyboardEvent) {
            if (!this.keyboardNavigationEnabled) {
                return;
            }
            if (event.key === "ArrowLeft" || event.code === "ArrowLeft" || event.which === 37) {
                this.previous()
            } else if (event.key === "ArrowRight" || event.code === "ArrowRight" || event.which === 39) {
                this.next()
            }
        }

        handleSwipeEvent(direction: string) {
            logger.info("Handling swipe event", direction);
            // if (!this.defaultNextActionEnabled) {
            //     logger.info("swipe is not enabled")
            //     return;
            // }
            if (direction === "left") {
                this.next()
            }

            if (direction === "right") {
                this.previous();
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "transitions";
    @import "variables";
    @import "mixins";

    .prompt-content-main {
        background: $beige no-repeat;
        background-image: url(/assets/images/transparentBlob1.svg), url(/assets/images/transparentBlob2.svg);
        font-size: 2rem;
        min-height: 100vh;
        overflow: hidden;
        position: relative;
        transition: background-position 1s, background-color 1s;
        width: 100%;

        @include r(374) {
            font-size: 2.4rem;
        }
        @include r(600) {
            align-items: center;
            display: flex;
        }
        @include r(768) {
            font-size: 3.2rem;
        }
        @include r(960) {
            font-size: 4rem;
        }
    }

    .progress {
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        width: 100%;
    }

    .card-container {
        position: relative;

        @include r(600) {
            align-items: center;
            display: flex;
            flex-grow: 1;
            margin: 0 auto;
            max-width: 110rem;
        }
    }


    .tertiary {
        cursor: pointer;
        padding: 1.6rem;

        @include r(600) {
            opacity: .5;
            padding: 2rem;
            transition: opacity .3s;

            &:hover {
                background: transparent;
                opacity: 1;
            }
        }

        svg {
            fill: $darkestGreen;
            height: 1.6rem;
            width: 1.6rem;
        }
    }

    .close {
        position: absolute;
        right: 0;
        top: 1rem;
        z-index: 20;
    }

    .arrow {
        position: absolute;
        top: 50vh;
        z-index: 1;

        &:disabled {
            display: none;
        }

        &.previous {
            left: 0;

            svg {
                transform: scale(-1);
            }
        }

        &.next {
            right: 0;
        }
    }
</style>