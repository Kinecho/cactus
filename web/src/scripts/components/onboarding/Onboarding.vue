<template>
    <div v-touch:swipe="handleSwipeEvent" class="onboarding-main" :class="`index-${index}`">
        <ProgressStepper :current="index" :total="totalPages"/>
        <button aria-label="Close" @click="closeOnboarding" title="Close" class="close tertiary icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <div class="progress-count" v-if="false">
            <span class="current">{{ index + 1 }}</span>&nbsp;of<span class="total">{{ totalPages }}</span>
        </div>

        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="card-container">
            <OnboardingCard
                    v-for="card in cards"
                    v-if="card.id === currentCard.id"
                    :key="card.id"
                    :card="card"
                    :product="product"
                    :member="member"
                    :checkout-info="checkoutInfo"
                    :selected-word="selectedWord"
                    :core-values-response="coreValuesResponse"
                    @selectedWord="setSelectedWord"
                    @coreValuesResponse="handleCoreValueResponse"
                    @next="nextAction"
                    @previous="previous"
                    @checkout="startCheckout"
                    @close="closeOnboarding"
                    @enableKeyboardNavigation="enableKeyboardNavigation"
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
import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
import Logger from "@shared/Logger"
import TextCard from "@components/onboarding/OnboardingTextCard.vue";
import ProgressStepper from "@components/ProgressStepper.vue";
import PhotoCard from "@components/onboarding/OnboardingPhotoCard.vue";
import OnboardingCard from "@components/onboarding/OnboardingCardWrapper.vue";
import { Prop, Watch } from "vue-property-decorator";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import { CheckoutInfo, PageStatus } from "@components/onboarding/OnboardingTypes";
import { PageRoute } from "@shared/PageRoutes";
import CactusMember from "@shared/models/CactusMember";
import { startCheckout } from "@web/checkoutService";
import { isNumber, stringifyJSON } from "@shared/util/ObjectUtil";
import Modal from "@components/Modal.vue";
import { pushRoute } from "@web/NavigationUtil";
import { InsightWord } from "@shared/api/InsightLanguageTypes";
import { QueryParam } from "@shared/util/queryParams";
import { fireOptInStartTrialEvent } from "@web/analytics";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import { getQueryParam } from "@web/util";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";

const logger = new Logger("Onboarding");

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
        Modal
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
    coreValuesResponse: CoreValuesAssessmentResponse | null = null;
    checkoutLoading = false;
    checkoutError: string | null = null;
    cardTransitionName = transitionName.next;
    keyListener: any = null;
    keyboardNavigationEnabled = true;
    firedCheckoutSuccessEvent = false;

    @Watch("pageStatus")
    onPageStatus(current: PageStatus | null) {
        if (!this.firedCheckoutSuccessEvent && current === PageStatus.success) {
            let priceDollars = StorageService.getNumber(LocalStorageKey.subscriptionPriceCents) ?? Number(getQueryParam(QueryParam.PURCHASE_AMOUNT));

            if (priceDollars && isNumber(priceDollars)) {
                priceDollars = priceDollars / 100;
                fireOptInStartTrialEvent({ value: priceDollars })
            } else {
                fireOptInStartTrialEvent({})
            }
            this.firedCheckoutSuccessEvent = true;
        }
    }

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
        this.onPageStatus(this.pageStatus);
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

    enableKeyboardNavigation(enabled: boolean) {
        this.keyboardNavigationEnabled = enabled;
    }

    setSelectedWord(word: InsightWord | null) {
        this.selectedWord = word;
    }

    handleCoreValueResponse(response: CoreValuesAssessmentResponse | null) {
        logger.info("handling core value results", response)
        this.coreValuesResponse = response;
    }

    setIndex(index: number) {
        this.$emit("index", index);
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

    async closeOnboarding(force: boolean = false) {
        if (this.showCloseConfirm || force) {
            await pushRoute(`${ PageRoute.MEMBER_HOME }?${ QueryParam.FROM }=onboarding`);
            return;
        }
        this.showCloseConfirm = true;
    }

    async startCheckout() {
        this.checkoutLoading = true;
        try {
            const successPath = `${ PageRoute.HELLO_ONBOARDING }/${ this.currentCard.slug ?? this.index }/success`
            const cancelPath = `${ PageRoute.HELLO_ONBOARDING }/${ this.currentCard.slug ?? this.index }`

            if (!this.product) {
                logger.error("No product was found, this is bad");
                return;
            }
            const result = await startCheckout({
                subscriptionProductId: this.product.entryId,
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
  background: $beige no-repeat;
  background-image: url(/assets/images/transparentBlob1.svg), url(/assets/images/transparentBlob2.svg);
  font-size: 2rem;
  min-height: 100vh;
  overflow: auto;
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

.index-0,
.index-8,
.index-12 {
  background-position: left 50vw bottom 50vh, left -50vw top 50vh;
}

.index-6 {
    background-position: left 50vw bottom 70vh, left -50vw top 70vh;
}

.index-1,
.index-5,
.index-7,
.index-11,
.index-13 {
  background-position: left -30vw bottom 75vh, left 0vw top 70vh;
}

.index-2,
.index-4,
.index-8,
.index-10 {
  background-position: left -30vw bottom -40vh, left 80vw top -30vh;
}

.index-3,
.index-9 {
  background-position: left 40vw bottom -70vh, left -10vw top -70vh;
}

.index-1 {
  background-color: lighten($lightDolphin, 10%);
}

.index-4 {
  background-color: lighten($pink, 12%);
}

.index-2,
.index-8 {
  background-color: lighten($green, 20%);
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

.confirm-body {
  background-color: $lightDolphin;
  padding: 2rem;
}
</style>
