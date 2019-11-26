<template>
    <skeleton-card v-if="!allLoaded" :sentPrompt="sentPrompt"/>
    <div v-else class="journalEntry" v-bind:class="{new: !completed, isDone: completed, hasNote: hasNote}">
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
        <div :class="{textContainer: !canReflectInline && hasBackgroundImage}" v-if="promptContent && !completed">
            <h3 class="topic" v-show="topicText">{{topicText}}</h3>
            <p class="subtext" v-show="subText">{{subText}}</p>
        </div>
        <div :class="{textContainer: !canReflectInline && hasBackgroundImage}" v-if="promptContent && completed">
            <h3 class="question" v-show="questionText">{{questionText}}</h3>
        </div>
        <div class="entry" v-if="!canReflectInline">{{responseText}}</div>
        <edit-reflection
                :show="canReflectInline"
                :responses="responses"
                :prompt="prompt"
                :responseMedium="responseMedium"
                @close="canReflectInline = false"
        />

        <div class="backgroundImage" v-if="!canReflectInline && hasBackgroundImage">
            <flamelink-image v-if="hasBackgroundImage" :image="backgroundImage"/>
            <div v-else class="random-placeholder" :class="backgroundClasses"></div>
        </div>

            <nav v-show="!canReflectInline" class="buttonContainer">
                <a :href="promptContentPath" class="button" v-show="!completed">{{promptCopy.REFLECT}}</a>
                <button @click.prevent="canReflectInline = true" class="wiggle secondary" v-show="completed && !hasNote">
                    <img src="assets/images/pen.svg" alt=""/>
                    {{promptCopy.ADD_A_NOTE}}
                </button>
            </nav>
            <modal :show="showContent"
                    v-on:close="showContent = false"
                    :showCloseButton="true"
                    :hideCloseButtonOnMobile="true"
            >
                <PromptContent slot="body"
                        v-bind:promptContentEntryId="entryId"
                        v-bind:isModal="true"
                        v-on:close="showContent = false"
                        :initialIndex="initialIndex"
                />
            </modal>
            <modal :show="showSharing" v-on:close="showSharing = false" :showCloseButton="true">
                <div class="sharing-card" slot="body">
                    <PromptSharing :promptContent="promptContent"/>
                </div>
            </modal>
            <modal :show="showShareNote" v-on:close="showShareNote = false" :showCloseButton="true" v-if="!!shareNote">
                <div class="sharing-card note" slot="body">
                    <prompt-content-card
                            :content="shareNote.content"
                            :response="shareNote.response"/>
                </div>
            </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PromptContent, {Content, ContentType, Image} from "@shared/models/PromptContent"
    import {PageRoute} from "@shared/PageRoutes"
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
    import PromptContentCard from "@components/PromptContentCard.vue"
    import JournalEntry from '@web/datasource/models/JournalEntry'

    const copy = CopyService.getSharedInstance().copy;
    const NUM_RANDO_BACKGROUND_IMAGES = 5;
    export default Vue.extend({
        components: {
            Modal,
            DropdownMenu,
            PromptContent: PromptContentVue,
            PromptContentCard,
            EditReflection,
            PromptSharing,
            FlamelinkImage,
            SkeletonCard
        },
        props: {
            entryId: {type: String, required: true},
            entry: {
                type: Object as () => JournalEntry,
                required: true,
            },
        },
        data(): {
            canReflectInline: boolean,
            error: any | undefined,
            loading: boolean,
            showContent: boolean,
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
            showSharing: boolean,
            promptCopy: PromptCopy,
            initialIndex: number | undefined,
            showShareNote: boolean,
            localEntry: JournalEntry,
            responses: ReflectionResponse[]|undefined,
            promptContent: PromptContent,
            content: Content[],
            prompt: ReflectionPrompt|undefined,
            sentPrompt: SentPrompt,
            responsesLoaded: boolean,
        } {
            return {
                canReflectInline: false,
                error: undefined,
                loading: false,
                showContent: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
                showSharing: false,
                promptCopy: copy.prompts,
                initialIndex: undefined,
                showShareNote: false,
                localEntry: this.entry,
                responses: this.entry.responses,
                promptContent: this.entry.promptContent!,
                content: this.entry.promptContent!.content,
                prompt: this.entry.prompt,
                sentPrompt: this.entry.sentPrompt,
                responsesLoaded: this.entry.responsesLoaded,
            }
        },
        computed: {
            shareNote():{content: Content, response: ReflectionResponse}|undefined {
                if (!this.promptContent || !this.responses || this.responses.length === 0){
                    return;
                }
                let shareReflectionCopy = isBlank(this.promptContent.shareReflectionCopy_md) ? copy.prompts.SHARE_PROMPT_COPY_MD : this.promptContent.shareReflectionCopy_md;
                const sharingCard: Content = {
                    contentType: ContentType.share_reflection,
                    text_md: shareReflectionCopy,
                    title: copy.prompts.SHARE_YOUR_NOTE,
                };

                const [response] = this.responses;
                if (response){
                    return {content: sharingCard, response: response}
                } else {
                    return
                }

            },
            allLoaded(): boolean {
                return !this.loading && this.responsesLoaded;
            },
            backgroundClasses(): { [name: string]: string } {
                const [first]: Content[] = (this.promptContent && this.promptContent.content) || [];
                const bgImage = first ? first.backgroundImage : undefined;
                const id = this.sentPrompt.promptId || "";

                const showRandomBackground = !bgImage;

                const classes: { [name: string]: any } = {
                    randomBackground: showRandomBackground,
                    [`bg${getIntegerFromStringBetween(id, NUM_RANDO_BACKGROUND_IMAGES - 1)}`]: showRandomBackground
                };

                return classes;
            },
            questionText(): string | undefined {
                let contentList = this.content;
                if (contentList) {
                    const reflectCard = contentList.find(c => c.contentType === ContentType.reflect);
                    return reflectCard && reflectCard.text;
                }
                return
                // return this.promptContent && this.promptContent.getQuestion();
            },
            backgroundImage(): Image | undefined {
                const [first]: Content[] = this.content;
                if (first && first.backgroundImage) {
                    return first.backgroundImage
                }
                return;
            },
            hasBackgroundImage(): boolean {
                return hasImage(this.backgroundImage);
            },
            topicText(): string | undefined {
                return this.promptContent?.subjectLine;
            },
            subText(): string | undefined {
                if (!this.promptContent) {
                    return;
                }

                const [first]: Content[] = this.content;
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
                return this.responses && this.responses.length > 0 || false;
            },
            hasNote(): boolean {
                return !isBlank(getResponseText(this.responses));
            },
            linkItems(): {
                title: string,
                href?: string,
                onClick?: () => void,
            }[] {
                const linkItems = [
                    {
                        title: copy.prompts.REFLECT,
                        href: this.promptContentPath,
                    },
                    {
                        title: this.hasNote ? copy.prompts.EDIT_NOTE : copy.prompts.ADD_A_NOTE,
                        onClick: () => {
                            this.canReflectInline = true;
                        }
                    },
                    {
                        title: copy.prompts.SHARE_PROMPT,
                        onClick: () => {
                            this.showSharing = true;
                        }
                    },
                ];


                if (this.hasNote && this.promptContent && this.promptContent.content) {
                    linkItems.push({
                        title: copy.prompts.SHARE_NOTE,
                        onClick: () => {
                            this.showShareNote = true
                        }
                    })
                }

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

        &.note {
            background: $lightBlue url(assets/images/lightGreenNeedles.svg) 0 0/250px;
            padding: 2.4rem 0;
            text-align: center;
        }
    }


</style>
