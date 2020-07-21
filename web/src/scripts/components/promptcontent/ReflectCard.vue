<template>
    <div class="prompt-content-card">
        <div class="elementReflectContainer">
            <div class="animation">
                <ElementAnimation :element="card.element"/>
            </div>
            <strong>
                <markdown-text :source="card.text"/>
            </strong>
            <transition name="component-fade" appear>
                <resizable-textarea :max-height-px="maxTextareaHeight">
                    <textarea placeholder="Write something..."
                            v-model="responseText"
                            type="text"
                            ref="noteInput"
                            :disabled="saving"
                            @focus="onNoteFocus"
                            @blur="onNoteBlur"
                    />
                </resizable-textarea>
            </transition>
            <share-warning v-if="card.noteShared"/>
            <button v-if="hasText" class="doneBtn icon no-loading" @click="saveAndContinue" :disabled="saving" :style="buttonStyles">
                <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                    <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                </svg>
                <span class="doneText">{{doneButtonText}}</span>
            </button>
            <button v-else-if="!hasText" class="skipBtn secondary no-loading" @click="skip" :disabled="saving" :style="buttonStyles">
                <span class="">{{skipButtonText}}</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { Prop, Watch } from "vue-property-decorator";
    import ElementAnimation from "@components/elements/animations/ElementAnimation.vue";
    import MarkdownText from "@components/MarkdownText.vue";
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import ReflectionResponseService from "@web/services/ReflectionResponseService";
    import Logger from "@shared/Logger"
    import { getDeviceDimensions, isIosDevice } from "@web/DeviceUtil";
    import { debounce } from "debounce";
    import ShareWarning from "@components/promptcontent/ShareWarning.vue";
    import { isBlank } from "@shared/util/StringUtil";
    import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";

    const logger = new Logger("ReflectCard");

    @Component({
        components: {
            ShareWarning,
            ElementAnimation,
            MarkdownText,
            ResizableTextarea,
        }
    })
    export default class ReflectCard extends Vue {
        name = "ReflectCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

        maxTextareaHeight = 200;
        responseText: string = ""
        errorMessage: string | null = null;
        saving = false;
        debounceWindowSizeHandler: any;
        startTime: Date = new Date();
        buttonStyles: Record<string, string> = {};
        noteFocused = false;

        @Watch("card")
        onCard(current?: PromptContentCardViewModel, previous?: PromptContentCardViewModel) {
            if (current?.responseText !== previous?.responseText) {
                this.responseText = current?.responseText ?? "";
            }
        }

        mounted() {
            logger.info("Reflect card mounted");

            this.startTime = new Date();
            this.onWidowSize();
            this.debounceWindowSizeHandler = debounce(this.onWidowSize, 500)
            window.addEventListener("resize", this.debounceWindowSizeHandler);
            window.visualViewport?.addEventListener("resize", this.debounceWindowSizeHandler)
            this.responseText = this.reflectionResponsesText ?? "";
        }

        beforeDestroy() {
            // this.reflectionUnsubscriber?.();
            window.removeEventListener("resize", this.debounceWindowSizeHandler);
            window.visualViewport?.removeEventListener("resize", this.debounceWindowSizeHandler);
        }

        get noteHeight(): number {
            return 0;
        }

        onNoteFocus() {
            this.$emit('enableKeyboardNavigation', false)
            this.noteFocused = true;
        }

        onNoteBlur() {
            this.$emit('enableKeyboardNavigation', true)
            this.noteFocused = false;
        }

        get doneButtonText(): string {
            return this.saving ? 'Saving....' : "Done";
        }

        get skipButtonText(): string {
            return this.saving ? 'Saving....' : "Skip";
        }

        get hasText(): boolean {
            return !isBlank(this.responseText);
        }

        get reflectionResponsesText(): string | null {
            const responses = this.card.responses ?? []
            if (responses.length > 0) {
                return responses.map(r => r.content.text).join("\n\n").trim();
            }
            return ""
        }

        onWidowSize() {
            this.maxTextareaHeight = getDeviceDimensions().height / 2;
            logger.info("set max text height to ", this.maxTextareaHeight);


            const offset = isIosDevice() && this.noteFocused ? 80 : 0;

            logger.info("Offset is", offset);
            let buttonHeight = 60;

            const top = getDeviceDimensions().height - buttonHeight + offset
            this.buttonStyles = {
                ...this.buttonStyles,
                top: `${ top }px`,
            }
        }

        get response(): ReflectionResponse | undefined {
            return this.card.responses?.[0];
        }

        /**
         * The time spent on this card during this viewing.
         * @return {number} - milliseconds spent reflecting
         */
        get currentReflectionDuration(): number {
            return Date.now() - this.startTime.getTime();
        }

        /**
         * The total time spent reflecting on this prompt.
         * This is the time currently spent reflecting (currentReflectionDuration) PLUS
         * the duration saved on the ReflectionResponse object
         * @return {number} milliseconds spent reflecting
         */
        get totalReflectionDurationMs(): number {
            return (this.response?.reflectionDurationMs ?? 0) + this.currentReflectionDuration;
        }

        async saveAndContinue() {
            this.errorMessage = null;
            const entryId = this.card.promptContent.entryId;
            logger.info("Saving and continuing for entryId", entryId);
            this.saving = true;
            let response = this.response;
            if (!response && entryId) {
                logger.info("no response found, but there was an entry id, so we can create a new response");

                response = ReflectionResponseService.createReflectionResponse(entryId, ResponseMedium.PROMPT_WEB);
                logger.info("...created a new reflection response");
            }

            if (!response) {
                logger.error("Unable to fetch or create a response... can not save");
                this.errorMessage = "Oops! We were unable to save your response. Please try again later.";
                this.saving = false;
                return;
            }

            logger.info("Setting the response content text to ", this.responseText);
            response.content.text = this.responseText;
            response.reflectionDurationMs = this.totalReflectionDurationMs;

            logger.info(`set total duration to ${ (response.reflectionDurationMs / 1000).toFixed(1) } seconds`);

            logger.info("Saving reflection response");
            await ReflectionResponseService.sharedInstance.save(response);
            this.saving = false;
            logger.info("Saved successfully.");
            this.$emit('next', true);
        }

        async skip() {
            await this.saveAndContinue();
        }

    }
</script>

<style scoped lang="scss">
    @import "prompts";
    @import "transitions";
    @import "mixins";

    .elementReflectContainer {
        padding: 0 1.6rem;
        width: 100%;

        @include r(600) {
            padding: 0 6.4rem;
        }
        @include r(1140) {
            min-width: 60vw;
        }
    }

    strong {
        display: block;
        margin-bottom: 1.2rem;

        @include r(768) {
            margin-bottom: 1.6rem;
        }
    }

    textarea {
        font-family: $font-stack;
        background: transparent;
        border: 0;
        color: $darkestGreen;
        font-size: 1.8rem;
        line-height: 1.4;
        margin: -1.2rem 0 3.2rem -.8rem;
        opacity: .8;
        padding: .8rem;
        width: 100%;
        resize: none;
        @include r(374) {
            font-size: 2rem;
        }
        @include r(768) {
            font-size: 2.4rem;
            margin: -1.6rem 0 3.2rem -1.6rem;
            padding: 1.6rem;
        }
        @include r(960) {
            font-size: 3.2rem;
        }

        &:focus {
            outline-color: rgba(0, 0, 0, .3);
        }
    }

    .doneBtn, .skipBtn {
        /*bottom: 2.4rem;*/
        position: absolute;
        right: 2.4rem;
        transition: opacity .3s, top .2s;


        @include r(768) {
            min-width: 14rem;
            position: static;
            width: auto;
        }
    }

    .doneBtn {
        padding: 1.6rem;

        @include r(768) {
            padding: 1.2rem 1.6rem 1.6rem;
        }

        .check {
            fill: $white;
            height: 1.8rem;
            width: 1.8rem;

            @include r(768) {
                display: none;
            }
        }

        &.icon .doneText {
            display: none;

            @include r(768) {
                display: inline;
            }
        }
    }
</style>