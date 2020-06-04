<template>
    <div v-touch:swipe="handleSwipeEvent">
        <ProgressStepper :current="index" :total="totalPages"/>
        <div class="progress-count">
            <span class="current">{{index + 1}}</span>&nbsp;of<span class="total">{{totalPages}}</span>
        </div>
        <div class="card-container">
            <transition-group :name="cardTransitionName" mode="in-out" appear>
                <Card class="card" v-for="card in cards" :card="card" :key="card.id" v-show="card.id === currentCard.id"/>
            </transition-group>
        </div>

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
    import Card from "@components/onboarding/OnboardingCard.vue";
    import Vue2TouchEvents from "vue2-touch-events";
    import ProgressStepper from "@components/ProgressStepper.vue";

    const logger = new Logger("Onboarding");
    Vue.use(Vue2TouchEvents)

    @Component({
        components: {
            Card,
            ProgressStepper,
        }
    })
    export default class Onboarding extends Vue {
        name = "Onboarding";

        cards: OnboardingCardViewModel[] = OnboardingCardViewModel.createAll();
        index: number = 0;
        cardTransitionName = "slide-left";

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
                this.cardTransitionName = "slide-left";
                this.index = Math.min(this.cards.length - 1, this.index + 1);
            }
        }

        previous() {
            if (this.previousEnabled) {
                this.cardTransitionName = "slide-right";
                this.index = Math.max(this.index - 1, 0);
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "transitions";

    .card-container {
        position: relative;

        .card {
            position: absolute;
            width: 100%;
        }
    }

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: center;
        position: absolute;
        background: $pink;
        padding: 1rem;
        bottom: 0;
        left: 0;
        right: 0;

        button {
            margin-right: 2rem;
            flex: 1;
        }
    }
</style>