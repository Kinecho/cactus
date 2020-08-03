<template>
    <div class="elementReflectContainer">
        <svg class="element" xmlns="http://www.w3.org/2000/svg" width="47" height="35" viewBox="0 0 47 35">
            <path vector-effect="non-scaling-stroke" class="path" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.07718848,33.0659031 C16.9034833,54.199668 20.7179299,20.251021 15.8579151,21.0429343 C10.9979002,21.8348476 13.8625604,37.5930451 19.6773127,37.9894412 C27.6775161,38.5348211 28.0221585,13.1185703 24.5423886,12.1275006 C19.4091615,10.6655114 24.3895721,41.7614486 30.3431156,42.9097293 C36.3335467,44.0651857 38.3505895,18.5270842 34.1893654,16.9067124 C29.4631525,15.0663352 32.4072958,35.8238194 37.147521,38.1746579 C44.9090376,42.0239099 46.864989,20.9520616 43.4838166,19.9890733 C38.3505895,18.5270842 43.573142,45.2571484 50.0771885,28.1235674" transform="rotate(9 89.608 -2.9)"/>
        </svg>
        <strong>
            <markdown-text :source="markdownText"/>
        </strong>

        <transition name="component-fade" appear>
            <resizable-textarea :max-height-px="maxTextareaHeight" ref="resizableTextArea" v-if="!responsesLoading">
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
        <button :class="responseText ? 'show' : 'hide'" class="doneBtn icon no-loading" @click="saveAndContinue" :disabled="saving">
            <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
            </svg>
            <span class="doneText">{{ saving ? 'Saving....' : 'Done' }}</span>
        </button>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import OnboardingCardViewModel, { TextReplacementType } from "@components/onboarding/OnboardingCardViewModel";
import MarkdownText from "@components/MarkdownText.vue";
import Logger from "@shared/Logger"
import ResultElement from "@components/gapanalysis/ResultElement.vue";
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import ReflectionResponseService from "@web/services/ReflectionResponseService";
import Spinner from "@components/Spinner.vue";
import ResizableTextarea from "@components/ResizableTextarea.vue";
import { getDeviceDimensions } from "@web/DeviceUtil";
import { debounce } from "debounce";
import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";
import { CoreValue } from "@shared/models/CoreValueTypes";

const logger = new Logger("OnboardingReflectCard");

@Component({
    components: {
        ResultElement,
        MarkdownText,
        Spinner,
        ResizableTextarea
    }
})
export default class OnboardingReflectCard extends Vue {
    name = "OnboardingReflectCard";

    @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
    card!: OnboardingCardViewModel;

    @Prop({ type: String, required: false, default: null })
    selectedInsightWord!: string | null;

    @Prop({ type: String as CoreValue, required: false, default: null })
    selectedCoreValue!: CoreValue | null;

    @Prop({ type: Boolean, default: true })
    autofocusInput!: boolean;

    responseText = ""
    saving = false;

    reflectionUnsubscriber?: ListenerUnsubscriber;
    responsesLoading: boolean = false;
    reflectionResponses: ReflectionResponse[] | null = null;
    errorMessage: string | null = null;
    maxTextareaHeight = 200;
    debounceWindowSizeHandler: any;

    startAt!: Date;

    get markdownText(): string | undefined {
        return this.card.getMarkdownText({
            selectedInsight: this.selectedInsightWord,
            selectedCoreValue: this.selectedCoreValue
        })
    }

    get loading(): boolean {
        return this.responsesLoading;
    }

    updateMaxTextareaHeight() {
        this.maxTextareaHeight = getDeviceDimensions().height / 2;
        logger.info("set max text height to ", this.maxTextareaHeight);
    }

    async observeResponses() {
        this.responsesLoading = true;
        this.reflectionUnsubscriber?.();
        if (this.card.promptContentEntryId) {
            this.reflectionUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(this.card.promptContentEntryId, {
                onData: (responses) => {
                    this.reflectionResponses = responses ?? null;
                    this.responsesLoading = false;
                    this.responseText = this.reflectionResponsesText;
                    logger.info("Set response text to ", this.reflectionResponsesText);
                }
            })
        }
    }

    get reflectionResponsesText(): string {
        const responses = this.reflectionResponses ?? []
        if (responses.length > 0) {
            return responses.map(r => r.content.text).join("\n\n").trim();
        }
        return ""
    }

    mounted() {
        logger.info("Reflect card mounted");
        this.startAt = new Date();
        if (this.autofocusInput) {
            (this.$refs.textInput as HTMLElement | undefined)?.focus();
        }

        this.observeResponses();
        this.updateMaxTextareaHeight();
        this.debounceWindowSizeHandler = debounce(this.updateMaxTextareaHeight, 500)
        window.addEventListener("resize", this.debounceWindowSizeHandler);
    }

    beforeDestroy() {
        this.reflectionUnsubscriber?.();
        window.removeEventListener("resize", this.debounceWindowSizeHandler);
    }

    async saveAndContinue() {
        this.errorMessage = null;
        const entryId = this.card.promptContentEntryId;
        logger.info("Saving and continuing for entryId", entryId);
        this.saving = true;
        const duration = Date.now() - this.startAt.getTime();
        let response: ReflectionResponse | undefined;

        if (this.reflectionResponses && this.reflectionResponses.length > 0) {
            response = this.reflectionResponses[0];
        }

        if (!response && this.card.promptContentEntryId) {
            response = ReflectionResponseService.createReflectionResponse(this.card.promptContentEntryId, ResponseMedium.PROMPT_WEB);
        }

        if (!response) {
            logger.error("Unable to fetch or create a response... can not save");
            this.errorMessage = "Oops! We were unable to save your response. Please try again later.";
            this.saving = false;
            return;
        }
        const currentDuration = response.reflectionDurationMs ?? 0;
        response.reflectionDurationMs = currentDuration + duration;
        response.content.text = this.responseText;


        let dynamicValue: string | null = null;
        switch (this.card.textReplacementType) {
            case TextReplacementType.selected_insight_word:
                dynamicValue = this.selectedInsightWord;
                break;
            case TextReplacementType.onboarding_core_value:
                dynamicValue = this.selectedCoreValue;
                break;
            default:
                break;
        }

        if (dynamicValue) {
            response.dynamicValues = {
                ...response.dynamicValues,
                [this.card.textReplacerToken]: dynamicValue
            }
        }

        await ReflectionResponseService.sharedInstance.save(response);
        this.saving = false;
        this.$emit('next');

    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";
@import "transitions";

.element {
  display: block;
  height: auto;
  margin-bottom: .8rem;
  max-width: 12rem;
  width: 24vw;

  @include r(600) {
    margin-bottom: 2.4rem;
  }

  .path {
    stroke: $pink;
    stroke-dasharray: 700;
    stroke-dashoffset: 700;
    animation: dash 35s ease-out .5s forwards;
  }
}

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

.element-icon {
  align-items: flex-start;
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
  position: fixed;
  right: 2.4rem;
  transition: opacity .3s;

  @include r(768) {
    min-width: 20rem;
    padding: 1.2rem 1.6rem 1.6rem;
    position: static;
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

  .doneText {
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
