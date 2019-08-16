<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="referralContainer">
        <NavBar/>
        <div class="centered content">
            <img class="graphic" src="/assets/images/friend2.svg" alt="Friends running"/>
            <h1>Invite Friends</h1>
            <div class="loading" v-if="loading">
                <Spinner message="Loading"/>
            </div>
            <div v-if="error" class="alert error">
                {{error}}
            </div>

            <transition name="fade-in" appear>
                <div v-if="member" class="member-container">
                    <p class="label">
                        Use this link to share Cactus with friends, family, and framily.
                    </p>
                    <div class="referral-link">
                        <input type="text" class="link-input" name="referral-link" :value="referralLink">
                        <button class="copy secondary" v-clipboard:copy="referralLink"
                                v-clipboard:success="handleCopySuccess"
                                v-clipboard:error="handleCopyError">
                            <span v-if="copySucceeded === true">Copied</span>
                            <span v-if="copySucceeded === false">Copy</span>
                        </button>
                    </div>
                    <social-sharing :url="referralLink"
                            title="I'm inviting you to Cactus"
                            description="See yourself and the world more positively."
                            quote="Cactus gives you a moment of mindfulness each day by asking you questions designed to help you better understand yourself."
                            twitter-user="itscalledcactus"
                            inline-template>
                        <div class="sharing">
                            <network network="email">
                                <button class="emailBtn btn wiggle">
                                    <img class="icon" src="/assets/images/envelopeSolid.svg" alt=""/>Email
                                </button>
                            </network>
                            <network network="twitter">
                                <button class="twBtn btn wiggle">
                                    <img class="icon" src="/assets/images/twitter.svg" alt=""/>Twitter
                                </button>
                            </network>
                            <network network="facebook">
                                <button class="fbBtn btn wiggle">
                                    <img class="icon" src="/assets/images/facebook.svg" alt=""/>Facebook
                                </button>
                            </network>
                        </div>
                    </social-sharing>
                </div>
            </transition>
            <div>

            </div>
        </div>
        <Footer/>
    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StardardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {Config} from "@web/config";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {PageRoute} from '@web/PageRoutes';
    import VueClipboard from 'vue-clipboard2';
    import SocialSharing from 'vue-social-sharing';

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);


    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner
        },
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.authLoaded = true;

                    if (!member) {
                        window.location.href = PageRoute.HOME;
                    }
                }
            })
        },
        destroyed() {
            if (this.memberUnsubscriber) {
                this.memberUnsubscriber();
            }
        },
        data(): {
            authLoaded: boolean,
            copySucceeded: boolean,
            member: CactusMember | undefined | null,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            error: string | undefined
        } {
            return {
                authLoaded: false,
                copySucceeded: false,
                member: undefined,
                memberUnsubscriber: undefined,
                error: undefined
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
        computed: {
            loading(): boolean {
                return !this.authLoaded;
            },
            referralLink(): string | undefined {
                return this.member ? `${Config.domain}?ref=${this.member.email}` : undefined;
            }
        }
    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";
    @import "social";

    .referralContainer {
        display: flex;
        flex-flow: column nowrap;
        height: 100vh;
        justify-content: space-between;

        header, .centered {
            width: 100%;
        }

        footer {
            flex-shrink: 0;
        }
    }

    .centered.content {
        flex-grow: 1;
        padding: 2.4rem;
    }

    .loading {
        display: flex;
        justify-content: center;
    }

    .graphic {
        margin-bottom: 2.4rem;
        max-width: 40rem;
        width: 100%;
    }

    .member-container {
        margin: 0 auto;
        max-width: 70rem;
    }

    .label {
        display: block;
        margin-bottom: 3.2rem;
    }

    .referral-link {
        margin-bottom: 3.2rem;
        position: relative;
    }

    .link-input {
        @include textInput;
        color: $lightText;
        margin-bottom: .8rem;
        max-width: none;
        width: 100%;

        @include r(600) {
            margin-bottom: 1.6rem;
        }
    }

    button.copy {
        width: 100%;

        @include r(600) {
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

    .sharing {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        margin-bottom: 4.8rem;

        @include r(600) {
            flex-flow: row wrap;
        }
    }

    .btn {
        align-items: center;
        display: flex;
        justify-content: center;
        margin-bottom: .8rem;
        width: 100%;

        @include r(600) {
            margin: 0 .4rem;
            width: auto;
        }
    }

    .icon {
        height: 2rem;
        margin-right: .8rem;
        width: 2rem;
    }


</style>
