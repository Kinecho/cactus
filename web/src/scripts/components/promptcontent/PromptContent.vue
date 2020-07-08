<template>
    <div v-touch:swipe="handleSwipeEvent" class="prompt-content-main" :class="[`index-${index}`, {isLastCard: isLastCard}]">
        <progress-stepper :total="totalPages" :current="contentIndex" class="progress"/>
        <button aria-label="Close" @click="closePrompt" title="Close" class="close tertiary icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <transition-group :name="cardTransitionName" mode="in-out" tag="div" class="card-container">
            <component
                    v-for="(card, i) in supportedCards"
                    v-if="i === index"
                    :is="getCardType(card)"
                    :card="card"
                    :index="i"
                    :key="`card_${i}`"
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
                        <prompt-button :button="card.content.actionButton" @next="next" @previous="previous" @complete="closePrompt"/>
                        <prompt-button :link="card.content.link"/>
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

        <!-- <Modal :show="showCloseConfirm" :show-close-button="false">
            <div slot="body" class="confirm-body">
                <h2>Are you sure you want to exit? Any unsaved progress will be lost.</h2>
                <button @click="showCloseConfirm = false">No, continue</button>
                <button @click="closePrompt()">Yes, exit.</button>
            </div>
        </Modal> -->

        <pricing-modal
                :showModal="showPricingModal"
                @close="showPricingModal = false"
        />

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContent, { ContentAction, ContentType } from "@shared/models/PromptContent";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import ProgressStepper from "@components/ProgressStepper.vue";
    import Logger from "@shared/Logger"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
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
    import { PageRoute } from "@shared/PageRoutes";
    import PricingModal from "@components/PricingModal.vue";
    import ElementDescriptionModal from "@components/ElementDescriptionModal.vue";
    import PromptButton from "@components/promptcontent/PromptButton.vue";
    import CardElement from "@components/promptcontent/CardElement.vue";
    import ActionButtonContainer from "@components/promptcontent/ActionButtonContainer.vue";

    export enum CardType {
        text = "text-card",
        photo = "photo-card",
        quote = "quote-card",
        reflect = "reflect-card",
        video = "video-card",
        reflection_analysis = "reflection-analysis-card",
        elements = "elements-card",
        share_note = "share-note-card",
        audio = "audio-card",
        invite_friends = "invite-friend-card",
    }

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

        @Prop({ type: Array as () => PromptContentCardViewModel[], required: true, default: [] })
        cards!: PromptContentCardViewModel[]

        cardTransitionName = transitionName.next;
        keyListener: any = null;
        keyboardNavigationEnabled = true;
        showCloseConfirm = false;
        showShareNote: boolean = false;
        showPricingModal = false;
        elementModalVisible = false;

        mounted() {
            this.keyListener = document.addEventListener("keyup", this.handleDocumentKeyUp)
        }

        destroyed() {
            document.removeEventListener("keyup", this.handleDocumentKeyUp);
        }

        enableKeyboardNavigation(enabled: boolean) {
            this.keyboardNavigationEnabled = enabled;
        }

        get supportedCards(): PromptContentCardViewModel[] {
            return this.cards.filter(card => !!this.getCardType(card));
        }

        getCardType(card: PromptContentCardViewModel): CardType | null {
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
                case ContentType.elements:
                    return CardType.elements;
                case ContentType.share_reflection:
                    return CardType.share_note;
                case ContentType.audio:
                    return CardType.audio;
                case ContentType.invite:
                    return CardType.invite_friends;
                default:
                    return null
            }
        }

        get card(): PromptContentCardViewModel {
            return this.supportedCards[this.index];
        }

        get shareReflectionCard(): PromptContentCardViewModel | null {
            return this.supportedCards.find(card => card.type === ContentType.reflect) ?? null
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

        get showNextButton(): boolean {
            return this.nextEnabled;
        }

        get nextEnabled(): boolean {
            const hasNextCard = this.index < this.totalPages - 1;
            logger.info("Has next card: ", true);
            return hasNextCard;
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

        showElementModal() {
            this.elementModalVisible = true;
            this.keyboardNavigationEnabled = false;
        }

        hideElementModal() {
            this.elementModalVisible = false;
            this.keyboardNavigationEnabled = true;
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

        handleButtonClick(action?: ContentAction | undefined | null) {
            logger.info("Handling button click", action);
            if (!action) {
                return;
            }

            switch (action) {
                case ContentAction.showPricing:
                    this.showPricingModal = true;
                    break;
                case ContentAction.next:
                    this.next();
                    break;
                case ContentAction.previous:
                    this.previous();
                    break;
                case ContentAction.complete:
                    // this.complete();
                    break;
                case ContentAction.coreValues:
                    window.open(`${ PageRoute.CORE_VALUES }`, "_blank");
                    break;
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

    .card-container {
        position: relative;
        width: 100vw;

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

        @include r(600) {
            justify-content: center;

            .card-container {
                flex-grow: 0;
            }
        }
    }

    .shareNote {
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