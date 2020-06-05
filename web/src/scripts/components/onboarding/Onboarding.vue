<template>
    <div v-touch:swipe="handleSwipeEvent" class="onboarding-main">
        <ProgressStepper :current="index" :total="totalPages"/>
        <div class="progress-count" v-if="false">
            <span class="current">{{index + 1}}</span>&nbsp;of<span class="total">{{totalPages}}</span>
        </div>

        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="card-container">
            <OnboardingCard
                    class="card"
                    v-for="card in cards"
                    v-show="card.id === currentCard.id"
                    :key="card.id"
                    :card="card"
            />
        </transition-group>

        <div class="footer actions">
            <button @click="previous" :disabled="!previousEnabled" class="no-loading">Previous</button>
            <button :disabled="!nextEnabled" @click="next" class="no-loading">Next</button>
        </div>
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
        height: 100vh;
        display: flex;
        flex: 1;
        flex-direction: column;
    }

    .card-container {
        position: relative;
        flex: 1;
        overflow: auto;

        .card {
            width: 100%;
        }
    }

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: center;
        /*position: fixed;*/
        background: $pink;
        padding: 1rem;
        bottom: 0;
        left: 0;
        right: 0;
        flex: 0;

        button {
            margin-right: 2rem;
            flex: 1;
        }
    }
</style>