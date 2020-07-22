<template>
    <skeleton-card v-if="!allLoaded" :sentPrompt="entry.sentPrompt"/>
    <div v-else class="journalEntry" v-bind:class="{new: !completed, isDone: completed, hasNote: hasNote}">
        <p class="date">{{dateLabel}}</p>
        <div class="menuParent">
            <dropdown-menu :items="linkItems"/>
        </div>

        <div v-if="error">
            <p v-show="error" class="warning prompt">
                {{error}}
            </p>
        </div>
        <div :class="{textContainer: !canReflectInline && hasBackgroundImage}" v-if="entry.promptContent && !completed">
            <h3 class="topic" v-show="topicText">{{preventOrphan(topicText)}}</h3>
            <p class="subtext" v-show="subText">{{preventOrphan(subText)}}</p>
        </div>
        <div :class="{textContainer: !canReflectInline && hasBackgroundImage}" v-if="entry.promptContent && completed">

            <h3 class="question" v-show="questionText">
                <markdown-text :source="preventOrphan(questionText)"/>
            </h3>
        </div>
        <div class="entry" v-if="!canReflectInline">{{preventOrphan(responseText)}}</div>
        <edit-reflection
                :show="canReflectInline"
                :responses="entry.responses"
                :prompt-content="entry.promptContent"
                :prompt="entry.prompt"
                :member="member"
                :responseMedium="responseMedium"
                @close="canReflectInline = false"
        />

        <div class="backgroundImage" v-if="!canReflectInline && hasBackgroundImage">
            <flamelink-image v-if="hasBackgroundImage" :image="backgroundImage"/>
            <div v-else class="random-placeholder" :class="backgroundClasses"></div>
        </div>

        <nav v-show="!canReflectInline && !hasNote" class="buttonContainer">
            <router-link :to="promptContentPath" class="button" v-show="!completed">{{promptCopy.REFLECT}}</router-link>
            <button @click.prevent="canReflectInline = true" class="wiggle secondary" v-show="completed && !hasNote">
                <img src="/assets/images/pen.svg" alt=""/>
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
                <PromptSharing :promptContent="entry.promptContent"/>
            </div>
        </modal>
        <modal :show="showShareNote" v-on:close="showShareNote = false" :showCloseButton="true" v-if="!!shareNote">
            <div class="sharing-card note" slot="body">
                <legacy-prompt-content-card
                        :prompt-content="entry.promptContent"
                        :content="shareNote.content"
                        :response="shareNote.response"/>
            </div>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Content, ContentType, Image } from "@shared/models/PromptContent"
    import { PageRoute } from "@shared/PageRoutes"
    import PromptContentVue from "@components/LegacyPromptContent.vue"
    import { formatDate } from "@shared/util/DateUtil"
    import ReflectionResponse, {
        ResponseMediumType
    } from "@shared/models/ReflectionResponse"
    import {
        getIntegerFromStringBetween,
        getResponseText,
        isBlank,
        preventOrphanedWords
    } from "@shared/util/StringUtil"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import Modal from "@components/Modal.vue"
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"
    import PromptSharing from "@components/PromptContentSharing.vue";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import { removeQueryParam, updateQueryParam } from '@web/util'
    import { QueryParam } from "@shared/util/queryParams"
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";
    import { hasImage } from '@shared/util/FlamelinkUtils'
    import CopyService from "@shared/copy/CopyService";
    import { PromptCopy } from "@shared/copy/CopyTypes"
    import LegacyPromptContentCard from "@components/LegacyPromptContentCard.vue"
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import Logger from "@shared/Logger";
    import { getAppType } from "@web/DeviceUtil";
    import CactusMember from "@shared/models/CactusMember";
    import MarkdownText from "@components/MarkdownText.vue";
    import { getResponseMedium, ResponseMedium } from "@shared/util/ReflectionResponseUtil";

    const logger = new Logger("JournalEntryPromptContentCard.vue");
    const copy = CopyService.getSharedInstance().copy;
    const NUM_RANDO_BACKGROUND_IMAGES = 5;
    export default Vue.extend({
        components: {
            Modal,
            DropdownMenu,
            LegacyPromptContent: PromptContentVue,
            LegacyPromptContentCard,
            EditReflection,
            PromptSharing,
            FlamelinkImage,
            SkeletonCard,
            MarkdownText,
        },
        props: {
            entryId: { type: String, required: true },
            member: Object as () => CactusMember,
            entry: {
                type: Object as () => JournalEntry,
                required: true,
            }
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
        } {
            return {
                canReflectInline: false,
                error: undefined,
                loading: false,
                showContent: false,
                editedText: "",
                editedResponses: [],
                responseMedium: getResponseMedium({ app: getAppType(), type: ResponseMediumType.JOURNAL }),
                showSharing: false,
                promptCopy: copy.prompts,
                initialIndex: undefined,
                showShareNote: false,
            }
        },
        computed: {
            shareNote(): { content: Content, response: ReflectionResponse } | undefined {
                if (!this.entry.promptContent || !this.entry.responses || this.entry.responses.length === 0) {
                    return;
                }
                let shareReflectionCopy = isBlank(this.entry.promptContent.shareReflectionCopy_md) ? copy.prompts.SHARE_PROMPT_COPY_MD : this.entry.promptContent.shareReflectionCopy_md;
                const sharingCard: Content = {
                    contentType: ContentType.share_reflection,
                    text_md: shareReflectionCopy,
                    title: copy.prompts.SHARE_YOUR_NOTE,
                };

                const [response] = this.entry.responses;
                if (response) {
                    return { content: sharingCard, response: response }
                } else {
                    return
                }

            },
            allLoaded(): boolean {
                return !this.loading && this.entry.allLoaded;
            },
            backgroundClasses(): { [name: string]: string | boolean } {
                const [first]: Content[] = (this.entry.promptContent && this.entry.promptContent.content) || [];
                const bgImage = first ? first.backgroundImage : undefined;
                const id = this.entry.promptId || "";

                const showRandomBackground = !bgImage;

                return {
                    randomBackground: showRandomBackground,
                    [`bg${ getIntegerFromStringBetween(id, NUM_RANDO_BACKGROUND_IMAGES - 1) }`]: showRandomBackground
                };

            },
            questionText(): string | undefined {
                let contentList = this.entry.promptContent?.content || [];
                const reflectCard = contentList?.find(c => c.contentType === ContentType.reflect);
                if (reflectCard) {
                    return this.entry.promptContent?.getDynamicDisplayText({
                        content: reflectCard,
                        member: this.member,
                        coreValue: this.entry.responses?.find(r => r.coreValue)?.coreValue,
                        dynamicValues: this.entry.responses?.find(r => !!r.dynamicValues)?.dynamicValues,
                    })
                }
                return
            },
            backgroundImage(): Image | undefined {
                const [first]: Content[] = this.entry.promptContent?.content || [];
                if (first && first.backgroundImage) {
                    return first.backgroundImage
                }
                return;
            },
            hasBackgroundImage(): boolean {
                return hasImage(this.backgroundImage);
            },
            topicText(): string | undefined {
                return this.entry.promptContent?.subjectLine;
            },
            subText(): string | undefined {
                if (!this.entry.promptContent) {
                    return;
                }

                const [first]: Content[] = this.entry.promptContent?.content || [];
                return first && first.text
            },
            promptContentPath(): string {
                return `${ PageRoute.PROMPTS_ROOT }/${ this.entryId }`
            },
            isTodaysPrompt(): boolean {
                return (this.promptDate == formatDate(new Date(), copy.settings.dates.longFormat))
            },
            promptDate(): string | undefined {
                if (this.entry.sentPrompt?.firstSentAt) {
                    return formatDate(this.entry.sentPrompt.firstSentAt, copy.settings.dates.longFormat);
                } else {
                    return formatDate(new Date(), copy.settings.dates.longFormat);
                }
            },
            dateLabel(): string | undefined {
                if (this.isTodaysPrompt) {
                    return copy.prompts.TODAY;
                } else {
                    return this.promptDate;
                }
            },
            responseText(): string | undefined {
                return getResponseText(this.entry.responses);
            },
            completed(): boolean {
                return this.entry.responsesLoaded && (this.entry.responses?.length || 0) > 0 || false;
            },
            hasNote(): boolean {
                return !isBlank(getResponseText(this.entry.responses));
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


                if (this.hasNote && this.entry.promptContent && this.entry.promptContent.content) {
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
                if (show && this.entry.promptContent && this.entry.promptContent.entryId) {
                    logger.log("adding prompt content entry id query param");
                    updateQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID, this.entry.promptContent.entryId);
                } else {
                    logger.log("removing prompt content entry id");
                    removeQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID);
                    removeQueryParam(QueryParam.CONTENT_INDEX);
                }
            }
        },
        methods: {
            preventOrphan(input?: string): string | undefined {
                return preventOrphanedWords(input)
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "journal";
    @import "transitions";

    .sharing-card {
        background-color: $darkerGreen;
        max-width: 100vw;
        min-height: 100vh;
        padding: 3.2rem;
        position: relative;

        @include r(600) {
            align-items: center;
            border-radius: 12px;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 66rem;
            max-width: 48rem;
        }

        &.note {
            background: $darkerGreen url(/assets/images/darkGreenNeedles.svg) 0 0/31rem;
            padding: 2.4rem 0;
            text-align: center;
        }
    }


</style>
