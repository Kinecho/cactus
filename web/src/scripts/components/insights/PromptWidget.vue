<template>
    <div class="today-widget" :class="{reflected: hasReflected}">
        <img class="blob" src="assets/images/transparentBlob1.svg"/>
        <img class="blob" src="assets/images/transparentBlob2.svg"/>
        <p class="date">Today</p>
        <spinner v-if="loading || !entry.allLoaded"/>
        <template v-else>
            <h3 class="question">
                <markdown-text :source="questionText"/>
            </h3>
            <p class="entry" v-if="!hasReflected && !reflectionText">
                <markdown-text :source="previewText"/>
            </p>

            <div class="backgroundImage">
                <flamelink-image :image="image"/>
            </div>
            <p class="refection" v-if="hasReflected && reflectionText">
                {{reflectionText}}
            </p>

            <div class="buttonContainer">
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
        background-color: $bgGreen;
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
        animation: rotateInfinite 48s infinite;
        height: auto;
        left: 0;
        position: absolute;
        top: 0;
        transform-origin: left top;
        width: 100vw;

        @include r(768) {
            width: 60rem;
        }

        &:nth-child(2) {
            animation-direction: reverse;
            bottom: 0;
            right: 0;
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
        margin-bottom: 2.4rem;
    }

    .question,
    .entry {
        width: 66%;
    }

    .entry {
        padding-left: 2rem;
        position: relative;
        white-space: pre-line;
        margin: 1.6rem 0 1.6rem -2rem;
        word-break: break-word;

        &:before {
            background-color: $royal;
            border-radius: 0 .4rem .4rem 0;
            content: '';
            display: block;
            height: 100%;
            left: .4rem;
            position: absolute;
            top: 0;
            width: .4rem;
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