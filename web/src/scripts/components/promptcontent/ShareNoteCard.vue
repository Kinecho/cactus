<template>
    <div class="prompt-content-card">
        <h2>{{copy.prompts.SHARE_YOUR_NOTE}}</h2>
        <p class="subtext">Feel more positive emotions when you share your note.</p>
        <shared-reflection-card :response="response" :prompt-content="this.card.promptContent" :question="this.card.text"/>

        <transition name="fade-in" mode="out-in">
            <div v-if="shareableLinkUrl" class="share-note-link-container">
                <transition name="snack" appear>
                    <snackbar-content :autoHide="true" v-if="linkCreated">
                        <svg slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                            <path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                        </svg>
                        <span slot="text">Shareable link created</span>
                    </snackbar-content>
                </transition>
                <p class="directLink">Here's your direct link to share:</p>
                <copy-text-input v-if="shareableLinkUrl" :text="shareableLinkUrl" :queryParams="shareableLinkParams" :editable="false" buttonStyle="primary"/>
                <div v-if="nativeShareEnabled" class="sharing">
                    <button class="btn secondary" @click="shareNatively()">
                        <img class="shareIcon" src="/assets/icons/share.svg" alt="Share Icon"/>Share
                    </button>
                </div>
            </div>
            <button v-else class="button primary getLink"
                    :disabled="creatingLink"
                    :class="{loading: creatingLink}"
                    @click="createSharableLink">
                {{creatingLink ? 'Creating' : 'Get Shareable Link'}}
            </button>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import MarkdownText from "@components/MarkdownText.vue";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponseService from "@web/services/ReflectionResponseService";
    import { QueryParam } from "@shared/util/queryParams";
    import SharingService from "@web/services/SharingService";
    import { gtag } from "@web/analytics";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import SharedReflectionCard from "@components/SharedReflectionCard.vue";
    import CopyTextInput from "@components/CopyTextInput.vue";
    import CopyService from "@shared/copy/CopyService";
    import SnackbarContent from "@components/SnackbarContent.vue"

    @Component({
        components: {
            MarkdownText,
            SharedReflectionCard,
            CopyTextInput,
            SnackbarContent,
        }
    })
    export default class TextCard extends Vue {
        name = "ShareNoteCard.vue";

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

        shareableLinkUrl: string | null = null;
        linkCreated: boolean = false;
        creatingLink: boolean = false;
        nativeShareEnabled = SharingService.canShareNatively();
        copy = CopyService.getSharedInstance().copy;

        beforeMount() {
            this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(this.card.responses?.[0]) ?? null;
        }

        get response(): ReflectionResponse | undefined {
            return this.card.responses?.[0];
        }

        get shareableLinkParams(): {} | undefined {
            if (this.shareableLinkUrl && this.card.member?.email) {
                return {
                    [QueryParam.REFERRED_BY_EMAIL]: this.card.member.email,
                    [QueryParam.UTM_MEDIUM]: "prompt-share-note",
                    [QueryParam.UTM_SOURCE]: "cactus.app",
                }
            }
            return;

        }

        async shareNatively() {
            await SharingService.shareLinkNatively({
                url: this.shareableLinkUrl ?? undefined,
                title: "Read my private reflection on Cactus",
                text: "I'm practicing mindful self-reflection with Cactus and shared this private note with you"
            })
        }

        async createSharableLink() {
            this.trackShareLink();
            this.creatingLink = true;
            let saved = await ReflectionResponseService.sharedInstance.shareResponse(this.response);
            this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(saved) ?? null;
            this.linkCreated = true;
            this.creatingLink = false;
        }

        trackShareLink() {
            gtag('event', 'click', {
                'event_category': "prompt_content",
                'event_action': "shared_reflection"
            });
        }

        get text(): string | null | undefined {
            return this.card.text;
        }

    }
</script>

<style scoped lang="scss">
    @import "prompts";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .prompt-content-card {
        background: $mediumDolphin url(/assets/images/grainy.png);
        color: $white;
        height: 100vh;
        overflow: hidden;
        overflow-y: auto;
        padding: 5.6rem 2.4rem;

        @include r(374) {
            padding: 5.6rem 3.2rem;
        }
        @include r(600) {
            @include shadowbox;
            background: $mediumDolphin url(/assets/images/grainy.png);
            min-height: 0;
            height: auto;
            padding: 5.6rem 4rem;
        }
    }

    h2 {
        @include r(600) {
            margin-top: -2.4rem;
        }
    }

    .subtext {
        margin-bottom: 3.2rem;
        opacity: .8;
    }

    .directLink {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

    .sharing {

        button {
            align-items: center;
            display: flex;
            flex-grow: 0;
            justify-content: center;
            margin-top: 3.2rem;
            width: 100%;

            @include r(600) {
                margin-top: 1.6rem;
                width: auto;
            }

            &:hover {
                background-color: $white;
            }
        }

        .shareIcon {
            height: 1.6rem;
            margin-right: .8rem;
            width: 1.6rem;
        }
    }

    .getLink {
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .snack {
        &-enter-active {
            transition: all .2s cubic-bezier(.42, .97, .52, 1.49)
        }

        &-leave-active {
            transition: all .2s ease;
        }

        &-enter {
            opacity: 0;
            transform: translateY(15px);
        }

        &-leave-to {
            opacity: 0;
            transform: translateX(-150px);
        }
    }
</style>