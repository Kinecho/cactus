<template>
        <skeleton-card v-if="!allLoaded" :sentPrompt="sentPrompt"/>
        <div v-else class="journalEntry" v-bind:class="{new: !completed, isDone: completed, hasNote: responseText}">
            <div class="doneStatus" v-show="responsesLoaded && completed">{{promptCopy.DONE}}</div>
            <p class="date">{{promptDate}}</p>
            <div class="menuParent">
                <dropdown-menu :items="linkItems"/>
            </div>

            <div v-if="error">
                <p v-show="error" class="warning prompt">
                    {{error}}
                </p>
            </div>
            <div class="textContainer" v-if="promptContent && !completed">
                <h3 class="topic" v-show="topicText">{{topicText}}</h3>
                <p class="subtext" v-show="subText">{{subText}}</p>
            </div>
            <div class="textContainer" v-if="promptContent && completed">
                <h3 class="question" v-show="topicText">{{questionText}}</h3>
            </div>
            <div class="entry" v-if="!doReflect">{{responseText}}</div>
            <edit-reflection
                    :show="doReflect"
                    :responses="responses"
                    :prompt="prompt"
                    :responseMedium="responseMedium"
                    @close="doReflect = false"
            />

            <div class="backgroundImage" v-if="!doReflect && hasBackgroundImage">
                <flamelink-image v-if="hasBackgroundImage" :image="backgroundImage"/>
                <div v-else class="random-placeholder" :class="backgroundClasses"></div>
            </div>

            <nav v-show="!doReflect" class="buttonContainer">
                <a :href="promptContentPath" @click.prevent="showContent = true" class="wiggle button" v-show="!completed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path fill="#fff" d="M3 3h6a1 1 0 0 1 .117 1.993L9 5H3a1 1 0 0 0-.993.883L2 6v11a1 1 0 0 0 .883.993L3 18h11a1 1 0 0 0 .993-.883L15 17v-6a1 1 0 0 1 1.993-.117L17 11v6a3 3 0 0 1-2.824 2.995L14 20H3a3 3 0 0 1-2.995-2.824L0 17V6a3 3 0 0 1 2.824-2.995L3 3h6zm10-3h6.02c.023 0 .046.002.07.004L19 0a1.008 1.008 0 0 1 .595.196c.04.03.077.061.112.097l-.09-.08a1.006 1.006 0 0 1 .376.67l.003.03.003.055L20 1v6a1 1 0 0 1-1.993.117L18 7V3.414l-9.293 9.293a1 1 0 0 1-1.32.083l-.094-.083a1 1 0 0 1 0-1.414L16.584 2H13a1 1 0 0 1-.117-1.993L13 0h6z"/>
                    </svg>
                    {{promptCopy.REFLECT}}</a>
                <button @click.prevent="doReflect = true" class="wiggle secondary" v-show="completed && !hasNote">
                    <img src="assets/images/pen.svg" alt=""/>
                    {{promptCopy.ADD_A_NOTE}}
                </button>
            </nav>
            <modal :show="showContent"
                    v-on:close="showContent = false"
                    :showCloseButton="true"
                    :closeStyles="{top: '2.4rem'}"
            >
                <PromptContent slot="body"
                        v-bind:promptContentEntryId="entryId"
                        v-bind:isModal="true"
                        v-on:close="showContent = false"
                />
            </modal>
            <modal :show="showSharing" v-on:close="showSharing = false" :showCloseButton="true">
                <div class="sharing-card" slot="body">
                    <PromptSharing :promptContent="promptContent"/>
                </div>

            </modal>
        </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PromptContent, {Content, Image} from "@shared/models/PromptContent"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import PromptContentService from '@web/services/PromptContentService'
    import {PageRoute} from "@web/PageRoutes"
    import PromptContentVue from "@components/PromptContent.vue"
    import SentPrompt from "@shared/models/SentPrompt"
    import {formatDate} from "@shared/util/DateUtil"
    import ReflectionResponse, {ResponseMedium} from "@shared/models/ReflectionResponse"
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import {getIntegerFromStringBetween, getResponseText, isBlank} from "@shared/util/StringUtil"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import Modal from "@components/Modal.vue"
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"
    import PromptSharing from "@components/PromptContentSharing.vue";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import {removeQueryParam, updateQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";
    import {hasImage} from '@shared/util/FlamelinkUtils'
    import CopyService from "@shared/copy/CopyService";
    import {PromptCopy} from "@shared/copy/CopyTypes"

    const copy = CopyService.getSharedInstance().copy;
    const NUM_RANDO_BACKGROUND_IMAGES = 5;
    export default Vue.extend({
        components: {
            Modal,
            DropdownMenu,
            PromptContent: PromptContentVue,
            EditReflection,
            PromptSharing,
            FlamelinkImage,
            SkeletonCard
        },
        created() {
            this.promptContentUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(this.entryId, {
                onData: (promptContent, error) => {
                    this.error = undefined;
                    if (error) {
                        console.error("JournalEntryPromptContentCard: Failed to get prompt content via subscriber", error);
                        this.promptContent = undefined;
                        this.error = "Unable to load the prompt";
                        this.loading = false;
                        return;
                    }

                    if (!promptContent) {
                        this.error = "Oops, we were unable to find the Prompt for this day."
                    } else {
                        this.promptContent = promptContent;
                    }
                    this.loading = false;
                }
            });
        },
        props: {
            entryId: {type: String, required: true},
            prompt: {type: Object as () => ReflectionPrompt},
            sentPrompt: {
                type: Object as () => SentPrompt
            },
            responses: {
                type: Array as () => ReflectionResponse[],
                required: false,
                default: [],
            },
            responsesLoaded: Boolean,
        },
        data(): {
            doReflect: boolean,
            promptContent: PromptContent | undefined,
            error: any | undefined,
            promptContentUnsubscriber: ListenerUnsubscriber | undefined,
            loading: boolean,
            showContent: boolean,
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
            showSharing: boolean,
            promptCopy: PromptCopy,
        } {
            return {
                doReflect: false,
                promptContent: undefined,
                error: undefined,
                promptContentUnsubscriber: undefined,
                loading: true,
                showContent: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
                showSharing: false,
                promptCopy: copy.prompts,
            }
        },
        computed: {
            allLoaded(): boolean {
                return !this.loading && this.responsesLoaded;
            },
            backgroundClasses(): { [name: string]: string } {
                const [first]: Content[] = (this.promptContent && this.promptContent.content) || [];
                const bgImage = first ? first.backgroundImage : undefined;
                const id = this.prompt.id;

                const showRandomBackground = !bgImage;

                const classes: { [name: string]: any } = {
                    randomBackground: showRandomBackground,
                    [`bg${getIntegerFromStringBetween(id || "", NUM_RANDO_BACKGROUND_IMAGES - 1)}`]: showRandomBackground
                };

                return classes;
            },
            questionText(): string | undefined {
                return this.promptContent && this.promptContent.getQuestion();
            },
            backgroundImage(): Image | undefined {
                const [first]: Content[] = (this.promptContent && this.promptContent.content) || [];
                if (first && first.backgroundImage) {
                    return first.backgroundImage
                }
                return;
            },
            hasBackgroundImage(): boolean {
                return hasImage(this.backgroundImage);
            },
            topicText(): string | undefined {
                return this.promptContent && this.promptContent.subjectLine;
            },
            subText(): string | undefined {
                if (!this.promptContent) {
                    return;
                }

                const [first]: Content[] = (this.promptContent && this.promptContent.content) || [];
                return first && first.text
            },
            promptContentPath(): string {
                return `${PageRoute.PROMPTS_ROOT}/${this.entryId}`
            },
            promptDate(): string | undefined {
                return formatDate(this.sentPrompt.firstSentAt, copy.settings.dates.longFormat)
            },
            responseText(): string | undefined {
                return getResponseText(this.responses);
            },
            completed(): boolean {
                return this.responses.length > 0;
            },
            hasNote(): boolean {
                return !isBlank(this.responseText);
            },
            linkItems(): {
                title: string,
                href?: string,
                onClick?: () => void,
            }[] {
                const linkItems = [
                    {
                        title: copy.prompts.REFLECT,
                        onClick: () => {
                            this.showContent = true;
                        }
                    }, {
                        title: copy.prompts.SHARE_PROMPT,
                        onClick: () => {
                            this.showSharing = true;
                        }
                    },
                    {
                        title: this.hasNote ? copy.prompts.EDIT_NOTE : copy.prompts.ADD_A_NOTE,
                        onClick: () => {
                            this.doReflect = true;
                        }
                    }];


                return linkItems
            },
        },
        watch: {
            showContent(show) {
                if (show && this.promptContent && this.promptContent.entryId) {
                    console.log("adding prompt content entry id query param");
                    updateQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID, this.promptContent.entryId);
                } else {
                    console.log("removing prompt content entry id");
                    removeQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID);
                    removeQueryParam(QueryParam.CONTENT_INDEX);
                }
            }
        },
        methods: {}
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "journal";
    @import "transitions";

    .sharing-card {
        @include shadowbox;
        max-width: 100vw;
        max-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;

        background: url(/assets/images/yellowNeedles.svg) $yellow;
        background-size: 80%;
        justify-content: center;
        padding: 3.2rem;
        position: relative;

        @include r(600) {
            border-radius: 12px;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            min-height: 66rem;
            max-width: 48rem;
        }
    }


</style>
