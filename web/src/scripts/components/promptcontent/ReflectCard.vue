<template>
    <div class="prompt-content-card">
        <p>Reflect {{index}} - {{card.type}}</p>
        <strong>
            <markdown-text :source="card.text"/>
        </strong>
        <div class="animation">
            <ElementAnimation :element="card.element"/>
        </div>
        <transition name="component-fade" appear>
            <resizable-textarea :max-height-px="maxTextareaHeight" ref="resizableTextArea">
                <textarea placeholder="Write something..."
                        v-model="responseText"
                        ref="textInput"
                        type="text"
                        :disabled="saving"
                        @focus="$emit('enableKeyboardNavigation', false)"
                        @blur="$emit('enableKeyboardNavigation', true)"
                />
            </resizable-textarea>
        </transition>
        <button v-if="responseText" class="doneBtn icon no-loading" @click="saveAndContinue" :disabled="saving">
            <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
            </svg>
            <span class="doneText">{{saving ? 'Saving....' : 'Done'}}</span>
        </button>
        <button v-else class="no-loading doneBtn" @click="saveAndContinue" :disabled="saving">
            <span class="doneText">{{saving ? 'Saving....' : 'Skip'}}</span>
        </button>
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
    import { ResponseMedium } from "@shared/models/ReflectionResponse";
    import ReflectionResponseService from "@web/services/ReflectionResponseService";
    import Logger from "@shared/Logger"
    import { getDeviceDimensions } from "@web/DeviceUtil";
    import { debounce } from "debounce";

    const logger = new Logger("ReflectCard");

    @Component({
        components: {
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

        @Prop({ type: Boolean, default: true })
        autofocusInput!: boolean;

        maxTextareaHeight = 200;
        responseText: string = ""
        errorMessage: string | null = null;
        saving = false;
        debounceWindowSizeHandler: any;

        @Watch("card")
        onCard(current?: PromptContentCardViewModel, previous?: PromptContentCardViewModel) {
            if (current?.responseText !== previous?.responseText) {
                this.responseText = current?.responseText ?? "";
            }
        }

        mounted() {
            logger.info("Reflect card mounted");
            if (this.autofocusInput) {
                (this.$refs.textInput as HTMLElement | undefined)?.focus();
            }

            // this.observeResponses();
            this.updateMaxTextareaHeight();
            this.debounceWindowSizeHandler = debounce(this.updateMaxTextareaHeight, 500)
            window.addEventListener("resize", this.debounceWindowSizeHandler);

            this.responseText = this.reflectionResponsesText ?? "";
        }

        beforeDestroy() {
            // this.reflectionUnsubscriber?.();
            window.removeEventListener("resize", this.debounceWindowSizeHandler);
        }

        get reflectionResponsesText(): string | null {
            const responses = this.card.responses ?? []
            if (responses.length > 0) {
                return responses.map(r => r.content.text).join("\n\n").trim();
            }
            return ""
        }

        updateMaxTextareaHeight() {
            this.maxTextareaHeight = getDeviceDimensions().height / 2;
            logger.info("set max text height to ", this.maxTextareaHeight);
        }

        async saveAndContinue() {
            this.errorMessage = null;
            const entryId = this.card.promptContent.entryId;
            logger.info("Saving and continuing for entryId", entryId);
            this.saving = true;

            let response = this.card.responses?.[0];

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
            // if (this.selectedInsightWord) {
            //     response.dynamicValues = {
            //         ...response.dynamicValues,
            //         [this.card.textReplacerToken]: this.selectedInsightWord
            //     }
            // }

            logger.info("Saving reflection response");
            await ReflectionResponseService.sharedInstance.save(response);
            this.saving = false;
            logger.info("Saved successfully.");
            this.$emit('next');
        }

    }
</script>

<style scoped lang="scss">
    @import "prompts";
    @import "transitions";

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

    .doneBtn {
        bottom: 2.4rem;
        padding: 1.6rem;
        /*position: fixed;*/
        right: 2.4rem;
        transition: opacity .3s;

        @include r(768) {
            min-width: 20rem;
            padding: 1.2rem 1.6rem 1.6rem;
            //position: static;
            width: auto;
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

        &.hide {
            opacity: 0;
        }

        &.show {
            opacity: 1;
        }
    }
</style>