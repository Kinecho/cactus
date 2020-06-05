<template>
    <div v-touch:swipe="handleSwipeEvent" class="onboarding-main">
        <ProgressStepper :current="index" :total="totalPages"/>
        <div class="progress-count" v-if="false">
            <span class="current">{{index + 1}}</span>&nbsp;of<span class="total">{{totalPages}}</span>
        </div>

        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="card-container">
            <OnboardingCard
                    class="cardi"
                    v-for="card in cards"
                    v-show="card.id === currentCard.id"
                    :key="card.id"
                    :card="card"
            />
        </transition-group>

        <button aria-label="Previous slide" @click="previous" :disabled="!previousEnabled" class="previous tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>
        <button aria-label="Next slide" :disabled="!nextEnabled" @click="next" class="next tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import Logger from "@shared/Logger"
    import TextCard from "@components/onboarding/OnboardingTextCard.vue";
    import Vue2TouchEvents from "vue2-touch-events";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import PhotoCard from "@components/onboarding/OnboardingPhotoCard.vue";
    import OnboardingCard from "@components/onboarding/OnboardingCardWrapper.vue";
    import { Prop } from "vue-property-decorator";

    const logger = new Logger("Onboarding");
    Vue.use(Vue2TouchEvents)

    const transitionName = {
        next: "slide-left-absolute",
        previous: "slide-right-absolute"
    }

    @Component({
        components: {
            TextCard,
            PhotoCard,
            ProgressStepper,
            OnboardingCard,
        }
    })
    export default class Onboarding extends Vue {
        name = "Onboarding";

        cards: OnboardingCardViewModel[] = OnboardingCardViewModel.createAll();

        @Prop({ type: Number, default: 0, required: true })
        index!: number;

        cardTransitionName = transitionName.next;

        keyListener: any = null;

        mounted() {
            this.keyListener = document.addEventListener("keyup", this.handleDocumentKeyUp)
        }

        destroyed() {
            document.removeEventListener("keyup", this.handleDocumentKeyUp);
        }

        get totalPages() {
            return this.cards.length;
        }

        get currentCard(): OnboardingCardViewModel {
            return this.cards[this.index];
        }

        get nextEnabled(): boolean {
            const hasNextCard = this.index < this.cards.length - 1;
            logger.info("Has next card: ", true);
            return hasNextCard;
        }

        get previousEnabled(): boolean {
            return this.index > 0;
        }

        setIndex(index: number) {
            this.$emit("index", index);
        }

        handleDocumentKeyUp(event: KeyboardEvent) {
            if (event.key === "ArrowLeft" || event.code === "ArrowLeft" || event.which === 37) {
                this.previous()
            } else if (event.key === "ArrowRight" || event.code === "ArrowRight" || event.which === 39) {
                this.next()
            }
        }

        handleSwipeEvent(direction: string) {
            logger.info("Handling swipe event", direction);
            if (direction === "left") {
                this.next()
            }

            if (direction === "right") {
                this.previous();
            }
        }

        next() {
            if (this.nextEnabled) {
                this.cardTransitionName = transitionName.next;
                const index = Math.min(this.cards.length - 1, this.index + 1);
                this.setIndex(index);
            }
        }

        previous() {
            if (this.previousEnabled) {
                this.cardTransitionName = transitionName.previous;
                const index = Math.max(this.index - 1, 0);
                this.setIndex(index);
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "transitions";

    .onboarding-main {
        background-color: $beige;
        font-size: 2rem;
        min-height: 100vh;
        overflow: auto;
        position: relative;
        width: 100%;

        @include r(374) {
            font-size: 2.4rem;
        }
        @include r(600) {
            align-items: center;
            display: flex;
            font-size: 3.2rem;
        }
        @include r(768) {
            font-size: 4rem;
        }
        @include r(960) {
            font-size: 4.8rem;
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
        padding: 2.4rem;

        @include r(374) {
            padding: 3.2rem;
        }
        @include r(600) {
            align-items: center;
            display: flex;
            flex-grow: 1;
            margin: 0 auto;
            max-width: 110rem;
            padding: 0;
        }
    }

    .cardi {
        max-width: 110rem; //must have to keep transition smooth
        width: 100%;
    }

    .tertiary {
        position: absolute;
        top: 50vh;
        z-index: 1;

        svg {
            fill: $darkestGreen;
            height: 1.6rem;
            width: 1.6rem;
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
