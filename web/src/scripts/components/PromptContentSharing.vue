<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="content-sharing centered">
        <div class="info">
            <img class="graphic" src="/assets/images/shareFriends.png" alt="Two blobs smiling at one another"/>
            <h2>Share With Friends</h2>
            <p>
                {{meta.title}}
            </p>
        </div>
        <div class="referral-link">
            <input type="text" class="link-input" name="referral-link" :disabled="true" :value="attributedLink">
            <button class="copy btn" v-clipboard:copy="attributedLink"
                    v-clipboard:success="handleCopySuccess"
                    v-clipboard:error="handleCopyError">
                <span v-if="copySucceeded === true">Copied</span>
                <span v-if="copySucceeded === false">Copy Link</span>
            </button>
        </div>
        <div class="sharingContainer">
            <div class="sharing native-sharing" v-if="nativeShareEnabled">
                <button class="btn wiggle  secondary" @click="shareNatively()" >
                    <img class="icon" src="/assets/images/share.svg" alt="Share Icon"/>
                </button>
            </div>
            <social-sharing :url="attributedLink"
                    :title="meta.title"
                    :description="meta.description"
                    :quote="meta.quote"
                    twitter-user="itscalledcactus"
                    inline-template>
                <div class="sharing">
                    <network network="email">
                        <button aria-label="Email" class="secondary btn wiggle">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18"><path fill="#29A389" d="M19 0c1.652 0 3 1.348 3 3v12c0 1.652-1.348 3-3 3H3c-1.652 0-3-1.348-3-3V3c0-1.652 1.348-3 3-3h16zm1 4.92l-8.427 5.9a1 1 0 01-1.146 0L2 4.92V15c0 .548.452 1 1 1h16c.548 0 1-.452 1-1V4.92zM19 2H3c-.388 0-.728.227-.893.554L11 8.779l8.893-6.225A1.006 1.006 0 0019 2z"/></svg>
                        </button>
                    </network>
                    <network network="twitter">
                        <button aria-label="Twitter" class="twBtn btn wiggle secondary">
                            <img src="/assets/images/twitter.svg" alt="Twitter Icon"/>
                        </button>
                    </network>
                    <network network="facebook">
                        <button aria-label="Facebook" class="fbBtn btn wiggle secondary">
                            <img src="/assets/images/facebook.svg" alt="Facebook Icon"/>
                        </button>
                    </network>
                </div>
            </social-sharing>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from '@shared/models/CactusMember'
    import SocialSharing from "vue-social-sharing"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMemberService from '@web/services/CactusMemberService'
    import {appendQueryParams} from '@shared/util/StringUtil'
    import {QueryParam} from "@shared/util/queryParams"
    import PromptContent from "@shared/models/PromptContent"
    import {PageRoute} from '@shared/PageRoutes'
    import {Config} from '@web/config';
    import VueClipboard from 'vue-clipboard2';
    import SharingService from '@web/services/SharingService'

    Vue.use(SocialSharing);
    Vue.use(VueClipboard);

    export default Vue.extend({
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.loading = false;
                }
            })
        },
        mounted() {

        },
        props: {
            promptContent: {
                type: Object as () => PromptContent | undefined,
                required: true,
            }
        },
        data(): {
            member: CactusMember | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            loading: boolean,
            copySucceeded: boolean,
            error: any | undefined,
            nativeShareEnabled: boolean,
        } {
            return {
                member: undefined,
                memberUnsubscriber: undefined,
                loading: true,
                copySucceeded: false,
                error: undefined,
                nativeShareEnabled: SharingService.canShareNatively()
            }
        },
        computed: {
            attributedLink(): string | undefined {
                const url = this.promptContent ? `${Config.domain}${PageRoute.PROMPTS_ROOT}/${this.promptContent.entryId}` : undefined;
                if (this.member && url) {
                    const email = this.member.email;
                    return appendQueryParams(url, {
                        [QueryParam.REFERRED_BY_EMAIL]: email,
                        [QueryParam.UTM_SOURCE]: "cactus.app",
                        [QueryParam.UTM_MEDIUM]: "prompt-share"
                    })
                }
                return url;
            },
            meta(): { title?: string, description?: string, quote?: string } {
                const meta: { title?: string, description?: string, quote?: string } = {
                    quote: "Cactus gives you a moment of mindfulness each day by asking you questions designed to help you better understand yourself."
                };
                if (this.promptContent) {
                    meta.title = this.promptContent.subjectLine;
                    const [firstContent] = this.promptContent.content;
                    meta.description = firstContent ? firstContent.text : undefined;
                }

                return meta;
            }
        },
        methods: {
            handleCopyError() {
                alert("Copied Failed");
            },
            handleCopySuccess() {
                this.copySucceeded = true;
                setTimeout(() => this.copySucceeded = false, 2000);
            },
            async shareNatively() {
                await SharingService.shareLinkNatively({url: this.attributedLink, text: this.meta.description, title: this.meta.title})
            }
        },
        destroyed(): void {
            if (this.memberUnsubscriber) {
                this.memberUnsubscriber();
            }
        }
    })
</script>

<!--NOT SCOPED-->
<style lang=scss>
    @import "social";

    .sharingContainer {
        display: flex;
        justify-content: center;
    }

    .content-sharing {
        .sharing {
            display: flex;
            justify-content: center;

            .btn {
                align-items: center;
                display: flex;
                justify-content: center;
                margin: 0 .4rem .8rem;
                width: auto;
            }

            img, svg {
                height: 1.8rem;
                width: 1.8rem;
            }

            .twBtn {
                background-color: $twitter;
                border-color: $twitter;

                &:hover {
                    background-color: darken($twitter, 5%)
                }
            }

            .fbBtn {
                background-color: $facebook;
                border-color: $facebook;

                &:hover {
                    background-color: darken($facebook, 5%)
                }
            }
        }
    }


</style>

<!--SCOPED-->
<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .content-sharing {
        display: flex;
        flex-direction: column;
        justify-content: center;

        @include isTinyPhone {
            min-height: calc(100vh - 5.6rem - 6.4rem);
        }
        @include biggerThanTinyPhone {
            min-height: calc(100vh - 9rem - 6.4rem);
        }
        @include r(600) {
            min-height: 66rem;
            height: 100%;
        }

        .graphic {
            margin-bottom: 1.6rem;
            width: 90%;

            @include r(374) {
                margin-bottom: 3.2rem;
                width: 70%;
            }
        }

        .info {
            color: $white;
            margin: 2.4rem 0;

            p {
                opacity: .8;
            }
        }

        .referral-link {
            margin-bottom: 1.6rem;
            position: relative;

            .link-input {
                @include textInput;
                color: $lightText;
                margin-bottom: .8rem;
                max-width: none;
                width: 100%;

                @include r(600) {
                    margin-bottom: 1.6rem;
                    padding-right: 9rem;
                }
            }

            button.copy {
                width: 100%;
                margin-bottom: 1.2rem;

                @include r(600) {
                    box-shadow: none;
                    padding: 1.2rem 2.4rem;
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: auto;
                }
            }
        }
    }


</style>
