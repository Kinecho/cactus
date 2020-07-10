<template>
    <div class="today-widget" :class="{reflected: hasReflected}">
        <img class="blob" src="assets/images/transparentBlob1.svg"/>
        <img class="blob" src="assets/images/transparentBlob2.svg"/>
        <p class="date">Today</p>
        <spinner v-if="loading || !entry.allLoaded"/>
        <template v-else>
            <h2 class="question">
                <markdown-text :source="questionText"/>
            </h2>
            <p class="previewText" v-if="!hasReflected && !reflectionText">
                <markdown-text :source="previewText"/>
            </p>
            <p class="entry" v-if="hasReflected && reflectionText">
                {{reflectionText}}
            </p>

            <div class="backgroundImage">
                <flamelink-image :image="image"/>
            </div>

            <div class="buttonContainer" v-if="!hasReflected">
                <router-link v-if="link" :to="link" tag="button">Reflect</router-link>
            </div>
        </template>
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
    import { getResponseText, preventOrphanedWords } from "@shared/util/StringUtil";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import { PageRoute } from "@shared/PageRoutes";

    @Component({
        components: {
            Spinner,
            MarkdownText,
            FlamelinkImage
        }
    })
    export default class PromptWidget extends Vue {
        name = "PromptWidget.vue";

        @Prop({ type: Boolean, required: false, default: true })
        loading!: boolean;

        @Prop({ type: Object as () => JournalEntry | null, required: false, default: null })
        entry!: JournalEntry | null;


        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        get link(): string | null {
            const entryId = this.entry?.promptContent?.entryId;
            return entryId ? `${ PageRoute.PROMPTS_ROOT }/${ this.entry?.promptContent?.entryId }` : null
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
        animation: rotateInfinite 60s infinite;
        height: auto;
        left: -3.2rem;
        position: absolute;
        top: -3.2rem;
        transform-origin: left top;
        width: 100vw;

        @include r(768) {
            width: 80rem;
        }

        &:nth-child(2) {
            animation-direction: reverse;
            bottom: -3.2rem;
            left: auto;
            right: -3.2rem;
            top: auto;
            transform-origin: right bottom;
        }
    }

    .date {
        font-size: 1.6rem;
        margin: .8rem 0 .4rem;
        opacity: .8;
    }

    .question {
        font-size: 2.1rem;
        line-height: 1.3;
        margin-bottom: .8rem;

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
    }

    .previewText {
        margin-bottom: 2.4rem;

        @include r(600) {
            margin: 1.6rem 0;
        }
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
            left: -1.2rem;
            position: absolute;
            top: 0;
            width: .4rem;

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
    }
</style>