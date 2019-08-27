<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="content-sharing centered">
        <div class="info">
            <img class="graphic" src="/assets/images/friend2.svg" alt="Friends running"/>
            <h2>Share With Friends</h2>
            <p>
                {{meta.title}}
            </p>
        </div>
        <div class="referral-link">
            <input type="text" class="link-input" name="referral-link" :value="attributedLink">
            <button class="copy secondary btn" v-clipboard:copy="attributedLink"
                    v-clipboard:success="handleCopySuccess"
                    v-clipboard:error="handleCopyError">
                <span v-if="copySucceeded === true">Copied</span>
                <span v-if="copySucceeded === false">Copy</span>
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
                    <button class="emailBtn small btn wiggle">
                        <img class="icon" src="/assets/images/envelopeSolid.svg" alt=""/>Email
                    </button>
                </network>
                <network network="twitter">
                    <button class="twBtn small btn wiggle">
                        <img class="icon" src="/assets/images/twitter.svg" alt=""/>Twitter
                    </button>
                </network>
                <network network="facebook">
                    <button class="fbBtn small btn wiggle">
                        <img class="icon" src="/assets/images/facebook.svg" alt=""/>Facebook
                    </button>
                </network>
            </div>
        </social-sharing>
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
    import {PageRoute} from '@web/PageRoutes'
    import {Config} from '@web/config';
    import VueClipboard from 'vue-clipboard2';

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
        } {
            return {
                member: undefined,
                memberUnsubscriber: undefined,
                loading: true,
                copySucceeded: false,
                error: undefined
            }
        },
        computed: {
            attributedLink(): string | undefined {
                const url = this.promptContent ? `${Config.domain}${PageRoute.PROMPTS_ROOT}/${this.promptContent.entryId}` : undefined;
                if (this.member && url) {
                    const email = this.member.email;
                    return appendQueryParams(url, {[QueryParam.REFERRED_BY_EMAIL]: email})
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

    .content-sharing {
        .sharing {
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;

            @include r(600) {
                flex-flow: row wrap;
            }

            .btn {
                align-items: center;
                display: flex;
                justify-content: center;
                margin: 0 auto .8rem;
                width: 100%;

                @include r(600) {
                    margin: 0 .4rem;
                    width: auto;
                }
            }

            .icon {
                height: 1.6rem;
                margin-right: .8rem;
                width: 1.6rem;
            }

            .twBtn {
                background-color: $twitter;

                &:hover {
                    background-color: darken($twitter, 5%)
                }
            }

            .fbBtn {
                background-color: $facebook;

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
            min-height: 0;
            height: 100%;
        }

        .graphic {
            margin-bottom: 3.2rem;
            width: 70%;
        }

        .info {
            margin: 2.4rem 0;
        }

        .referral-link {
            margin-bottom: 3.2rem;
            position: relative;

            .link-input {
                @include textInput;
                color: $lightText;
                margin-bottom: .8rem;
                max-width: none;
                width: 100%;
                text-overflow: ellipsis;

                @include r(600) {
                    margin-bottom: 1.6rem;
                    padding-right: 9rem;
                }
            }

            button.copy {
                background-color: $lightGreen;
                width: 100%;
                margin-bottom: 1.2rem;

                @include r(600) {
                    background-color: transparent;
                    border: none;
                    box-shadow: none;
                    padding: 1.2rem 2.4rem;
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: auto;

                    &:hover {
                        background: transparent;
                    }

                    &:active {
                        background-color: $darkGreen;
                        color: $white;
                    }
                }
            }
        }
    }


</style>
