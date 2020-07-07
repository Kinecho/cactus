<template>
    <div class="today-widget" :class="{reflected: hasReflected}">
        <h4>Today</h4>
        <spinner v-if="loading || !entry.allLoaded"/>
        <template v-else>
            <template>
                <h3>
                    <markdown-text :source="questionText"/>
                </h3>
                <p v-if="!hasReflected && !reflectionText">
                    <markdown-text :source="previewText"/>
                </p>

                <div class="backgroundImage">
                    <flamelink-image :image="image"/>
                </div>
                <p class="refection" v-if="hasReflected && reflectionText">
                    {{reflectionText}}
                </p>

                <router-link v-if="link" :to="link" tag="button">Reflect</router-link>
            </template>
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
        @include shadowbox;
        margin: 0 auto 3.2rem;
        overflow: hidden;
        padding: 1.6rem 1.6rem 2.4rem;
        position: relative;
        text-align: left;

        @include r(600) {
            // max width is defined by the parent container, see JournalHome.vue
            padding: 3.2rem 2.4rem;
        }

        @include r(768) {
            margin-bottom: 4.8rem;
            padding: 3.2rem;
        }

    }

    .reflected {
        .backgroundImage {
            height: 8rem;
            overflow: hidden;
            z-index: 0;
        }
    }

    .backgroundImage {
        height: 23rem;
        overflow: hidden;
        z-index: 0;

        @include r(600) {
            height: 100%;
            margin: 0;
            max-width: 28rem;
            top: 7.2rem;
        }

        img {
            display: block;
            margin: auto;
            max-height: 100%;
            max-width: 100%;
        }
    }

    .reflection {
        white-space: pre-wrap;
    }

</style>