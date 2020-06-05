<template>
    <div v-touch:swipe="handleSwipeEvent" class="onboarding-main">
        <ProgressStepper :current="index" :total="totalPages"/>
        <div class="progress-count" v-if="false">
            <span class="current">{{index + 1}}</span>&nbsp;of<span class="total">{{totalPages}}</span>
        </div>

        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="card-container">
            <OnboardingCard
                    class="onboardingCard"
                    v-for="card in cards"
                    v-if="card.id === currentCard.id"
                    :key="card.id"
                    :card="card"
                    :product="product"
                    :member="member"
                    :checkout-info="checkoutInfo"
                    :selected-word="selectedWord"
                    @selectedWord="setSelectedWord"
                    @next="nextAction"
                    @previous="previous"
                    @checkout="startCheckout"
                    @close="closeOnboarding"
            />
        </transition-group>

        <button aria-label="Previous slide" @click="previous" :disabled="!previousEnabled" class="previous tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>
        <button v-if="showNextButton" aria-label="Next slide" :disabled="!nextEnabled" @click="next" class="next tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>

        <Modal :show="showCloseConfirm" :show-close-button="false">
            <div slot="body" class="confirm-body">
                <h2>Are you sure you want to exit? Any unsaved progress will be lost.</h2>
                <button @click="showCloseConfirm = false">No, continue</button>
                <button @click="closeOnboarding">Yes, exit.</button>
            </div>
        </Modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import OnboardingCardViewModel, { CardType } from "@components/onboarding/OnboardingCardViewModel";
    import Logger from "@shared/Logger"
    import TextCard from "@components/onboarding/OnboardingTextCard.vue";
    import Vue2TouchEvents from "vue2-touch-events";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import PhotoCard from "@components/onboarding/OnboardingPhotoCard.vue";
    import OnboardingCard from "@components/onboarding/OnboardingCardWrapper.vue";
    import { Prop } from "vue-property-decorator";
    import SubscriptionProduct from "@shared/models/SubscriptionProduct";
    import { CheckoutInfo, PageStatus } from "@components/onboarding/OnboardingTypes";
    import { PageRoute } from "@shared/PageRoutes";
    import CactusMember from "@shared/models/CactusMember";
    import { startCheckout } from "@web/checkoutService";
    import { stringifyJSON } from "@shared/util/ObjectUtil";
    import { InsightWord } from "@shared/models/ReflectionResponse";
    import Modal from "@components/Modal.vue";
    import { pushRoute } from "@web/NavigationUtil";

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
            Modal,
        }
    })
    export default class Onboarding extends Vue {
        name = "Onboarding";

        @Prop({ type: Array as () => OnboardingCardViewModel[], required: true })
        cards!: OnboardingCardViewModel[];

        @Prop({ type: Number, default: 0, required: true })
        index!: number;

        @Prop({ type: Object as () => SubscriptionProduct, required: false, default: null })
        product?: SubscriptionProduct | null;

        @Prop({ type: String as () => PageStatus, required: false, default: null })
        pageStatus!: PageStatus | null;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember

        showCloseConfirm = false;
        selectedWord: InsightWord | null = null;
        checkoutLoading = false;
        checkoutError: string | null = null;
        cardTransitionName = transitionName.next;
        keyListener: any = null;

        get checkoutInfo(): CheckoutInfo {
            const success = this.pageStatus === PageStatus.success;
            return {
                loading: this.checkoutLoading && !success,
                success: success,
                error: this.checkoutError
            }
        }

        mounted() {
            this.keyListener = document.addEventListener("keyup", this.handleDocumentKeyUp)
        }

        destroyed() {
            document.removeEventListener("keyup", this.handleDocumentKeyUp);
        }

        get showNextButton(): boolean {
            return this.defaultNextActionEnabled && this.nextEnabled;
        }

        get defaultNextActionEnabled(): boolean {
            return this.currentCard.defaultNextActionsEnabled
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

        setSelectedWord(word: InsightWord | null) {
            this.selectedWord = word;
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
            if (!this.defaultNextActionEnabled) {
                logger.info("swipe is not enabled")
                return;
            }
            if (direction === "left") {
                this.next()
            }

            if (direction === "right") {
                this.previous();
            }
        }

        /**
         * Action for when the component fires "Next".
         */
        nextAction() {
            this.next(true);
        }

        next(force = false) {
            if ((this.nextEnabled && this.defaultNextActionEnabled) || force) {
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

        async closeOnboarding(force: boolean=false) {
            if (this.showCloseConfirm || force) {
                await pushRoute(PageRoute.JOURNAL_HOME);
                return;
            }
            this.showCloseConfirm = true;
        }

        async startCheckout() {
            this.checkoutLoading = true;
            try {
                const successPath = `${ PageRoute.ONBOARDING }/${ this.currentCard.slug ?? this.index }/success`
                const cancelPath = `${ PageRoute.ONBOARDING }/${ this.currentCard.slug ?? this.index }`

                if (!this.product) {
                    logger.error("No product was found, this is bad");
                    return;
                }
                const result = await startCheckout({
                    subscriptionProductId: this.product.entryId!,
                    subscriptionProduct: this.product,
                    member: this.member,
                    stripeSuccessUrl: successPath,
                    stripeCancelUrl: cancelPath,
                })
                this.checkoutLoading = false;
                if (!result.success && !result.canceled) {
                    this.checkoutError = "Oops! We were unable to start the checkout process. Please try again later."
                }
                logger.info("Checkout result", stringifyJSON(result, 2));
            } catch (error) {
                logger.error("An error was thrown during Onboarding checkout.", error);
                this.checkoutError = "Oops! We were unable to start the checkout process. Please try again later."
                this.checkoutLoading = false;
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
        padding: 4rem 2.4rem;

        @include r(374) {
            padding: 5.6rem 3.2rem;
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

    .onboardingCard {
        max-width: 110rem; //must have to keep transition smooth
        width: 100%;
    }

    .tertiary {
        cursor: pointer;
        position: absolute;
        top: 50vh;
        z-index: 1;

        @include r(600) {
            opacity: .5;
            transition: opacity .3s;

            &:hover {
                background: transparent;
                opacity: 1;
            }
        }

        &:disabled {
            display: none;
        }

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

    .confirm-body {
        background-color: $lightDolphin;
        padding: 2rem;
    }
</style>
