<template>
    <div class="today-widget" :class="{reflected: hasReflected}">
        <img class="blob" src="/assets/images/transparentBlob1.svg"/>
        <img class="blob" src="/assets/images/transparentBlob2.svg"/>
        <transition name="component-fade" appear>
            <spinner v-if="loading || (entry && !allLoaded)" :delay="1500"/>
            <!-- Using a div here so that the fade transition works -->
            <div v-else-if="entry">
                <p class="date">Today</p>
                <h2 class="question">
                    <markdown-text :source="questionText"/>
                </h2>
                <p class="previewText" v-if="!hasReflected && !reflectionText">
                    <markdown-text :source="previewText"/>
                </p>
                <p class="entry" v-if="!isEditingNote && hasReflected && reflectionText" @click="isEditingNote = true">
                    {{reflectionText}}
                </p>

                <edit-reflection
                        :show="isEditingNote"
                        :responses="entry.responses"
                        :prompt-content="entry.promptContent"
                        :prompt="entry.prompt"
                        :member="member"
                        :responseMedium="responseMedium"
                        @close="isEditingNote = false"
                />

                <div class="backgroundImage">
                    <flamelink-image :image="image"/>
                </div>

                <div class="buttonContainer" v-if="!hasNote || !hasReflected && !isEditingNote">
                    <router-link v-if="link && !hasReflected" :to="link" tag="button">Reflect</router-link>
                    <button v-if="!hasNote && !isEditingNote && hasReflected" @click="isEditingNote = true" class="secondary">
                        <img class="pen" src="/assets/images/pen.svg" alt=""/>Add a Note
                    </button>
                </div>
            </div>
            <div v-else-if="noPromptFound" class="noPrompt">
                <h2 class="question">Uh oh</h2>
                <p class="previewText">There seems to be an issue finding today's prompt. Please check back a little later.</p>
                <div class="backgroundImage">
                    <img src="/assets/images/error.png" alt="Cactus Error Image"/>
                </div>
            </div>
        </transition>
        <dropdown-menu :items="linkItems" class="dotsBtn" v-if="!noPromptFound"/>
        <!-- <modal :show="showSharing" v-on:close="showSharing = false" :showCloseButton="true">
            <div class="sharing-card" slot="body">
                <PromptSharing :promptContent="entry.promptContent"/>
            </div>
        </modal> -->
        <modal :show="shareModalOpen"
                v-on:close="shareModalOpen = false"
                :showCloseButton="true"
                v-if="shareNoteCard">
            <div class="sharing-card note" slot="body">
                <share-note-card
                        :card="shareNoteCard"/>
            </div>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Spinner from "@components/Spinner.vue";
    import { Prop } from "vue-property-decorator";
    import JournalEntry from "@web/datasource/models/JournalEntry";
    import CactusMember from "@shared/models/CactusMember";
    import { ContentBackgroundImage, ContentType, Image } from "@shared/models/PromptContent";
    import MarkdownText from "@components/MarkdownText.vue";
    import { getResponseText, isBlank, preventOrphanedWords } from "@shared/util/StringUtil";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import { PageRoute } from "@shared/PageRoutes";
    import DropdownMenu from "@components/DropdownMenu.vue";
    import CopyService from "@shared/copy/CopyService";
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"
    import { DropdownMenuLink } from "@components/DropdownMenuTypes";
    import Modal from "@components/Modal.vue";
    import ShareNoteCard from "@components/promptcontent/ShareNoteCard.vue";
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";

    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            ShareNoteCard,
            Spinner,
            Modal,
            MarkdownText,
            EditReflection,
            DropdownMenu,
            FlamelinkImage
        }
    })
    export default class PromptWidget extends Vue {
        name = "PromptWidget.vue";

        @Prop({ type: Boolean, required: false, default: true })
        loading!: boolean;

        isEditingNote: boolean = false;

        @Prop({ type: String as () => ResponseMedium, required: false, default: ResponseMedium.JOURNAL_WEB })
        responseMedium!: ResponseMedium;

        @Prop({ type: Object as () => JournalEntry | null, required: false, default: null })
        entry!: JournalEntry | null;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        shareModalOpen = false;

        get noPromptFound(): boolean {
            return !this.entry && !this.loading
        }

        get allLoaded(): boolean {
            return this.entry?.allLoaded === true;
        }

        get link(): string | null {
            const entryId = this.entry?.promptContent?.entryId;
            return entryId ? `${ PageRoute.PROMPTS_ROOT }/${ this.entry?.promptContent?.entryId }` : null
        }

        get hasNote(): boolean {
            return !isBlank(getResponseText(this.entry?.responses));
        }

        get shareNoteCard(): PromptContentCardViewModel | null {
            if (this.entry?.promptContent && this.entry?.prompt && this.hasNote) {
                return PromptContentCardViewModel.createShareNote({
                    member: this.member,
                    responses: this.entry?.responses ?? [],
                    promptContent: this.entry?.promptContent,
                    prompt: this.entry?.prompt,
                })
            } else {
                return null
            }

        }

        get linkItems(): DropdownMenuLink[] {
            const links: DropdownMenuLink[] = [
                {
                    title: copy.prompts.REFLECT,
                    href: this.link,
                },
            ]
            if (this.hasReflected) {
                links.push({
                    title: this.hasNote ? copy.prompts.EDIT_NOTE : copy.prompts.ADD_A_NOTE,
                    onClick: () => {
                        this.isEditingNote = true;
                    }
                });
            }

            if (this.hasNote) {
                links.push({
                    title: copy.prompts.SHARE_YOUR_NOTE,
                    onClick: () => {
                        this.shareModalOpen = true;
                    }
                })
            }

            return links;
        }

        get hasReflected(): boolean {
            return (this.entry?.responses ?? []).length > 0;
        }

        get reflectionText(): string | undefined {
            return getResponseText(this.entry?.responses);
        }

        get questionText(): string | undefined {
            let contentList = this.entry?.promptContent?.content || [];
            const reflectCard = contentList?.find(c => c.contentType === ContentType.reflect);
            if (reflectCard) {
                const text = this.entry?.promptContent?.getDynamicDisplayText({
                    content: reflectCard,
                    member: this.member,
                    coreValue: this.entry.responses?.find(r => r.coreValue)?.coreValue,
                    dynamicValues: this.entry.responses?.find(r => !!r.dynamicValues)?.dynamicValues,
                })
                return preventOrphanedWords(text);
            }
            return
        }

        get previewText(): string | undefined {
            return this.entry?.promptContent?.getDynamicPreviewText({
                member: this.member,
                coreValue: this.entry.responses?.find(r => r.coreValue)?.coreValue ?? undefined,
                dynamicValues: this.entry.responses?.find(r => !!r.dynamicValues)?.dynamicValues,
            })
        }

        get image(): ContentBackgroundImage | Image | undefined {
            const image = this.entry?.promptContent?.content[0]?.backgroundImage ?? this.entry?.promptContent?.content[0]?.photo;
            if (image?.url || image?.flamelinkFileName || image?.storageUrl) {
                return image;
            }
            return undefined;
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "insights";
    @import "transitions";

    .today-widget {
        background-color: $beige;
        border-radius: 1.6rem;
        box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.032),
        0 11.5px 32.3px -24px rgba(0, 0, 0, 0.056),
        0 13.9px 37.7px -24px rgba(0, 0, 0, 0.094),
        0 24px 63px -24px rgba(0, 0, 0, 0.35);
        margin: 0 2.4rem 3.2rem;
        overflow: hidden;
        padding: 2.4rem;
        position: relative;

        @include r(374) {
            margin: 0 0 3.2rem;
            padding: 2.4rem 3.2rem 3.2rem;
        }
        @include r(600) {
            min-height: 24rem;
        }
        @include r(768) {
            margin-bottom: 4.8rem;
        }
    }

    .blob {
        animation: 30s ease-in reverse forwards rotate180;
        height: auto;
        left: -3.2rem;
        position: absolute;
        top: -3.2rem;
        transform-origin: 20rem 20rem;
        width: 100vw;
        z-index: 0;

        @include r(768) {
            width: 80rem;
        }

        &:nth-child(2) {
            animation-direction: normal;
            animation-duration: 45s;
            bottom: -3.2rem;
            left: auto;
            right: -3.2rem;
            top: auto;
        }
    }

    .date {
        font-size: 1.6rem;
        margin: .8rem 0 1.6rem;
        opacity: .8;
    }

    .question {
        font-size: 2.1rem;
        line-height: 1.3;
        margin-bottom: .4rem;

        @include r(600) {
            font-size: 2.4rem;
        }
    }

    .question,
    .entry,
    .previewText {
        @include r(600) {
            width: 66%;
        }
        @include r(960) {
            width: 50%;

            .reflected & {
                width: 66%;
            }
        }
    }

    .previewText {
        margin: 0 0 1.6rem;
    }

    .entry {
        margin: 0 0 2.4rem -2rem;
        padding-left: 2rem;
        position: relative;
        white-space: pre-line;
        word-break: break-word;

        @include r(600) {
            margin: 1.6rem 0;
        }

        &:before {
            background-color: $royal;
            border-radius: 0 .4rem .4rem 0;
            content: '';
            display: block;
            height: 100%;
            left: -.4rem;
            position: absolute;
            top: 0;
            width: .4rem;

            @include r(374) {
                left: -1.2rem;
            }
            @include r(600) {
                border-radius: .4rem;
                left: 0;
            }
        }
    }

    .backgroundImage {
        height: 28rem;
        margin: 0 0 -14rem;
        overflow: hidden;
        position: relative;
        right: 0;
        z-index: 0;

        @include r(600) {
            height: auto;
            left: 66%;
            position: absolute;
            top: 3.2rem;
            width: 24rem;
            z-index: 0;
        }
        @include r(768) {
            width: 36rem;
        }
        @include r(960) {
            left: 50%;

            .reflected & {
                left: 66%;
            }
        }

        img {
            display: block;
            margin: auto;
            max-height: 100%;
            max-width: 100%;
        }
    }

    .buttonContainer {
        margin-top: 2.4rem;
        position: relative;
        z-index: 1;

        button {
            width: 100%;

            @include r(600) {
                min-width: 16rem;
                width: auto;
            }
        }

        .pen {
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }

        button.secondary {
            align-items: center;
            display: flex;
            justify-content: center;

            &:hover {
                background-color: $white;

                .pen {
                    animation: wiggle .5s forwards;
                }
            }
        }
    }

    form {
        position: relative;
        z-index: 1;
    }

    .noPrompt {
        padding: 1.6rem .8rem 0;

        .previewText {
            font-size: 2rem;
        }

        .backgroundImage {
            transform: scaleX(-1);
        }
    }
</style>