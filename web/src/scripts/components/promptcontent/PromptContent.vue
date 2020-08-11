<template>
    <div v-touch:swipe="handleSwipeEvent"
            class="prompt-content-main"
            :class="[`index-${index}`, {isLastCard: isLastCard}]"
    >
        <progress-stepper :total="totalPages" :current="contentIndex" class="progress"/>
        <button aria-label="Close" @click="closePrompt" title="Close" class="close tertiary icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="slide-container">
            <component
                    class="card-container"
                    :key="`card_${i}`"
                    v-for="(card, i) in supportedCards"
                    v-if="i === index"
                    :is="getCardType(card)"
                    :card="card"
                    :index="i"
                    @enableKeyboardNavigation="enableKeyboardNavigation"
                    @close="closePrompt"
                    @next="next"
                    @previous="previous"
            >
                <template v-slot:element>
                    <card-element :card="card" :animated="false" :stacked="false"/>
                </template>
                <template v-slot:actions>
                    <action-button-container>
                        <template v-if="isLastCard">
                            <button class="button" @click="closePrompt">Done</button>
                            <button v-if="hasNote" class="button tertiary shareNote" @click="showShareNote = true">
                                <svg-icon icon="share"/>
                                Share Note
                            </button>
                        </template>
                        <prompt-button v-if="card.actionButton" :button="card.actionButton" @next="next" @previous="previous" @complete="closePrompt"/>
                        <prompt-button v-if="card.link" :link="card.link"/>
                    </action-button-container>
                </template>
            </component>
        </transition-group>

        <button aria-label="Previous slide" @click="previous" :disabled="!previousEnabled" class="arrow icon previous tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>
        <button v-if="showNextButton" aria-label="Next slide" :disabled="!nextEnabled" @click="next" class="arrow icon next tertiary no-loading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
            </svg>
        </button>
        <modal :show="showShareNote && !!shareReflectionCard" @close="showShareNote = false" :showCloseButton="true">
            <div class="sharing-card note" slot="body">
                <ShareNoteCard :card="shareReflectionCard"/>
            </div>
        </modal>

        <pricing-modal
                :showModal="showPricingModal"
                @close="showPricingModal = false"
        />

    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import PromptContent, { ContentType } from "@shared/models/PromptContent";
import { Prop } from "vue-property-decorator";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import ProgressStepper from "@components/ProgressStepper.vue";
import Logger from "@shared/Logger"
import PromptContentCardViewModel, {
    CardType,
    isPromptContentCardViewModel,
    PromptCardViewModel
} from "@components/promptcontent/PromptContentCardViewModel";
import TextCard from "@components/promptcontent/TextCard.vue";
import PhotoCard from "@components/promptcontent/PhotoCard.vue";
import ReflectCard from "@components/promptcontent/ReflectCard.vue";
import QuoteCard from "@components/promptcontent/QuoteCard.vue";
import VideoCard from "@components/promptcontent/VideoCard.vue";
import ReflectionAnalysisCard from "@components/promptcontent/ReflectionAnalysisCard.vue";
import Modal from "@components/Modal.vue";
import { isBlank } from "@shared/util/StringUtil";
import ShareNoteCard from "@components/promptcontent/ShareNoteCard.vue";
import SvgIcon from "@components/SvgIcon.vue";
import ElementsCard from "@components/promptcontent/ElementsCard.vue";
import AudioCard from "@components/promptcontent/AudioCard.vue";
import InviteFriendsCard from "@components/promptcontent/InviteFriendsCard.vue";
import OnboardingActionButton from "@components/OnboardingActionButton.vue";
import PricingModal from "@components/PricingModal.vue";
import ElementDescriptionModal from "@components/ElementDescriptionModal.vue";
import PromptButton from "@components/promptcontent/PromptButton.vue";
import CardElement from "@components/promptcontent/CardElement.vue";
import ActionButtonContainer from "@components/promptcontent/ActionButtonContainer.vue";
import MilestoneCard from "@components/promptcontent/MilestoneCard.vue";

const logger = new Logger("PromptContent");

    const transitionName = {
        next: "slide-left-absolute",
        previous: "slide-right-absolute"
    }

    @Component({
        components: {
            ActionButtonContainer,
            CardElement,
            PromptButton,
            ActionButton: OnboardingActionButton,
            ShareNoteCard,
            [CardType.text]: TextCard,
            [CardType.photo]: PhotoCard,
            [CardType.reflect]: ReflectCard,
            [CardType.quote]: QuoteCard,
            [CardType.video]: VideoCard,
            [CardType.elements]: ElementsCard,
            [CardType.share_note]: ShareNoteCard,
            [CardType.audio]: AudioCard,
            [CardType.invite_friends]: InviteFriendsCard,
            [CardType.reflection_analysis]: ReflectionAnalysisCard,
            [CardType.milestones]: MilestoneCard,
            ProgressStepper,
            PricingModal,
            ElementDescriptionModal,
            SvgIcon,
            Modal,

        }
    })
    export default class PromptView extends Vue {
        name = "PromptContent.vue";

        @Prop({ type: Array as () => ReflectionResponse[], required: false, default: null })
        responses!: ReflectionResponse[] | null;

        /**
         * Zero-based index of the current card to show
         */
        @Prop({ type: Number, required: false, default: 0 })
        index!: number;

        @Prop({ type: Array as () => PromptCardViewModel[], required: true, default: [] })
        cards!: PromptCardViewModel[]

        cardTransitionName = transitionName.next;
        keyListener: any = null;
        keyboardNavigationEnabled = true;
        showCloseConfirm = false;
        showShareNote: boolean = false;
        showPricingModal = false;

        mounted() {
            this.keyListener = document.addEventListener("keyup", this.handleDocumentKeyUp)
        }

        destroyed() {
            document.removeEventListener("keyup", this.handleDocumentKeyUp);
        }

        enableKeyboardNavigation(enabled: boolean) {
            this.keyboardNavigationEnabled = enabled;
        }

        get supportedCards(): PromptCardViewModel[] {
            return this.cards.filter(card => !!this.getCardType(card));
        }

        getCardType(card: PromptCardViewModel): CardType | null {
            return card.cardType
        }

        get card(): PromptCardViewModel {
            return this.supportedCards[this.index];
        }

        get shareReflectionCard(): PromptContentCardViewModel | null {
            const found = this.supportedCards.find(card => {
                if (!isPromptContentCardViewModel(card)){
                    return false
                }
                return card.type === ContentType.reflect
            })
            if (found && isPromptContentCardViewModel(found)) {
                return found
            }
            return null;
        }

        get hasNote(): boolean {
            return this.responses?.some(r => !isBlank(r.content.text)) ?? false;
        }

        /**
         * Ensure the index is within the bounds of the content array
         * @return {number}
         */
        get contentIndex(): number {
            return Math.min(Math.max(this.index, 0), this.totalPages - 1);
        }

        get totalPages(): number {
            return this.supportedCards.length;
        }

        get isReflectCard(): boolean {
            return this.card.cardType === CardType.reflect;
        }

        get showNextButton(): boolean {
            return this.nextEnabled;
        }

        get nextEnabled(): boolean {
            const hasNextCard = this.index < this.totalPages - 1;
            logger.info("Has next card: ", true);
            return hasNextCard && !this.isReflectCard;
        }

        get previousEnabled(): boolean {
            return this.index > 0;
        }

        get isLastCard(): boolean {
            return this.index >= this.totalPages - 1;
        }

        async closePrompt(force: boolean = false) {
            if (this.showCloseConfirm || force || this.isLastCard) {
                // await pushRoute(PageRoute.JOURNAL_HOME);
                this.$emit("close");
                return;
            }
            this.showCloseConfirm = true;
        }

        next(force: boolean = false) {
            if (this.nextEnabled || force) {
                this.cardTransitionName = transitionName.next;
                this.$emit('next');
            }
        }

        previous(force: boolean = false) {
            if (this.previousEnabled || force) {
                this.cardTransitionName = transitionName.previous;
                this.$emit("previous");
            }
        }

        handleDocumentKeyUp(event: KeyboardEvent) {
            if (!this.keyboardNavigationEnabled || this.isReflectCard) {
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
            if (this.isReflectCard) {
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
        overflow: hidden;
        transition: background-position 1s, background-color 1s;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;

        @include r(374) {
            font-size: 2.4rem;
        }
        @include r(600) {
            align-items: center;
            display: flex;
            flex-direction: column;
        }
        @include r(768) {
            font-size: 3.2rem;
        }
        @include r(960) {
            font-size: 4rem;
        }
    }

    .index-0,
    .index-6,
    .index-8,
    .index-12 {
        background-position: left 50vw bottom 50vh, left -50vw top 50vh;
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

    .progress {
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        width: 100%;
    }

    .slide-container {
        display: flex;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: absolute;
        overflow: hidden;
    }

    .card-container {
        position: absolute;
        width: 100%;
        overflow: auto;
        overflow-scrolling: touch;
        height: 100%;

        @include r(600) {
            align-items: center;
            display: flex;
            flex-grow: 1;
            justify-content: center;
            margin: 0 auto;
            max-width: 110rem;
        }
    }

    .element-container {
        cursor: pointer;
        text-align: center;
    }

    .tertiary.icon {
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
        @include shadowbox;
        background-color: $lightDolphin;
        padding: 2rem;
    }

    .isLastCard {
        background-color: lighten($green, 20%);
    }

    .actions .shareNote {
        align-items: center;
        color: $darkerGreen;
        display: flex;
        justify-content: center;

        .icon {
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }
    }

</style>