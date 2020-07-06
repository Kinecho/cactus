<template>
    <div class="prompt-content-card">
        <h2>{{copy.prompts.SHARE_YOUR_NOTE}}</h2>
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

    @Component({
        components: {
            MarkdownText,
            SharedReflectionCard,
            CopyTextInput,
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

    .prompt-content-card {
        background: $darkerGreen url(/assets/images/darkGreenNeedles.svg);
        color: $white;
        border-radius: 4rem;
    }
</style>