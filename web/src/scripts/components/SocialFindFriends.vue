<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="SocialFindFriends">
        <!-- suggested friends -->
        <friend-list v-bind:member="member" />

        <div class="loading" v-if="loading">
            <Spinner message="Loading" name="socialFindFriends"/>
        </div>

        <!-- find your friends -->
        <div class="find-friends">
            <h1>Invite friends to reflect</h1>
            <p class="subtext">Share your unique link.</p>
            <div class="referral-link">
                <input type="text" class="link-input" name="referral-link" :value="referralLink" disabled="true">
                <button class="copy" v-clipboard:copy="referralLink"
                        v-clipboard:success="handleCopySuccess"
                        v-clipboard:error="handleCopyError">
                    <span v-if="copySucceeded === true">Copied!</span>
                    <span v-if="copySucceeded === false">Copy <span class="invitetxt">Invite</span> Link</span>
                </button>
            </div>
            <social-sharing :url="referralLink"
                    title="I'm inviting you to Cactus"
                    description="Boost your mood and emotional intelligence in one minute."
                    quote="Cactus gives you a moment of mindfulness each day by asking you questions designed to help you better understand yourself."
                    twitter-user="itscalledcactus"
                    inline-template>
                <div class="btnContainer">
                    <network network="email">
                        <button aria-label="Email" class="secondary btn wiggle">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18">
                                <path fill="#29A389" d="M19 0c1.652 0 3 1.348 3 3v12c0 1.652-1.348 3-3 3H3c-1.652 0-3-1.348-3-3V3c0-1.652 1.348-3 3-3h16zm1 4.92l-8.427 5.9a1 1 0 01-1.146 0L2 4.92V15c0 .548.452 1 1 1h16c.548 0 1-.452 1-1V4.92zM19 2H3c-.388 0-.728.227-.893.554L11 8.779l8.893-6.225A1.006 1.006 0 0019 2z"/>
                            </svg>
                            Email
                        </button>
                    </network>
                    <network network="twitter">
                        <button aria-label="Twitter" class="secondary btn wiggle">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path fill="#1da1f2" d="M47 9.424a18.957 18.957 0 01-5.42 1.488 9.49 9.49 0 004.149-5.224 18.901 18.901 0 01-5.997 2.29A9.42 9.42 0 0032.844 5c-5.21 0-9.437 4.227-9.437 9.437 0 .738.084 1.46.245 2.149-7.843-.393-14.795-4.157-19.45-9.866a9.402 9.402 0 00-1.278 4.754 9.421 9.421 0 004.199 7.85 9.357 9.357 0 01-4.276-1.18v.12c0 4.571 3.25 8.384 7.57 9.255a9.355 9.355 0 01-2.486.33c-.611 0-1.201-.056-1.777-.168 1.2 3.742 4.684 6.48 8.812 6.55A18.888 18.888 0 013.247 38.27c-.765 0-1.51-.042-2.247-.126a26.708 26.708 0 0014.465 4.234c17.358 0 26.851-14.38 26.851-26.844 0-.415-.007-.822-.028-1.23A18.877 18.877 0 0047 9.424"/>
                            </svg>
                            Twitter
                        </button>
                    </network>
                    <network network="facebook">
                        <button aria-label="Facebook" class="secondary btn wiggle">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path fill="#3b5998" d="M41.151 3H6.85C4.75 3 3 4.75 3 6.849V41.15C3 43.25 4.75 45 6.849 45H24V27.5h-5.25v-5.25H24V17c0-4.375 1.75-7 7-7h5.25v5.25h-2.276C32.4 15.25 31 16.651 31 18.224v4.026h7l-.875 5.25H31V45h10.151C43.25 45 45 43.25 45 41.151V6.85C45 4.75 43.25 3 41.151 3z"/>
                            </svg>
                            Facebook
                        </button>
                    </network>
                </div>
            </social-sharing>

            <!-- if not imported -->
            <div class="results" v-if="!importedContacts">
                <h2>Invite your contacts</h2>
                <p class="subtext">You'll choose which of your contacts to invite.</p>
                <div class="btnContainer">
                    <button class="secondary wiggle btn cloudsponge-launch" data-cloudsponge-source="gmail">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="#D44638" d="M22 6.25v12.5c0 .708-.542 1.25-1.25 1.25H19.5V8.656L12 14.042 4.5 8.656V20H3.25C2.54 20 2 19.458 2 18.75V6.25c0-.354.135-.667.36-.89.223-.227.537-.36.89-.36h.417L12 11.042 20.333 5h.417c.354 0 .667.135.89.36.226.223.36.536.36.89z"/>
                        </svg>
                        Gmail
                    </button>
                    <button class="secondary wiggle btn cloudsponge-launch" data-cloudsponge-source="yahoo">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="#440099" d="M13.18 22s-.7-.127-1.263-.127c-.508 0-1.27.127-1.27.127l.16-8.496C9.627 11.466 6.162 5.258 4 2c1.088.248 1.545.232 2.638 0l.016.028c1.377 2.439 3.483 5.838 5.263 8.784C13.674 7.918 16.44 3.398 17.19 2c.85.223 1.707.215 2.657 0-1 1.348-4.638 7.644-6.837 11.504L13.174 22h.007z"/>
                        </svg>
                        Yahoo
                    </button>
                </div>
                <!-- end -->
            </div>

            <div class="results" v-if="importedContacts">
                <h2>{{importedService}} Contacts <span class="resultCount">({{importedContacts.length}})</span></h2>
                <template v-for="contact in importedContacts">
                    <SocialImportedContact 
                        v-bind:contact="contact" 
                        v-bind:member="member" />
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";
    import AddressBookService from '@web/services/AddressBookService'
    import SocialImportedContact from "@components/SocialImportedContact.vue"
    import {EmailService} from "@shared/types/EmailContactTypes";
    import VueClipboard from 'vue-clipboard2';
    import SocialSharing from 'vue-social-sharing';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {Config} from "@web/config";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {PageRoute} from '@web/PageRoutes';
    import {generateReferralLink} from '@shared/util/SocialInviteUtil';
    import StorageService from '@web/services/StorageService';
    import SocialFriendList from "@components/SocialFriendList.vue"

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);

    export default Vue.extend({
        components: {
            Spinner,
            SocialImportedContact,
            FriendList: SocialFriendList
        },
        beforeMount() {
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
        created() {
            AddressBookService.sharedInstance.start();
        },
        mounted() {
            this.configureCloudsponge();
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
            importedContacts: Array<any> | undefined,
            importedService: string | undefined,
        } {
            return {
                authLoaded: false,
                copySucceeded: false,
                importedContacts: undefined,
                importedService: undefined,
                member: undefined,
                memberUnsubscriber: undefined,
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
            importContacts: function (contacts: Array<any>, source: string) {
                this.importedContacts = AddressBookService.sharedInstance.formatContacts(contacts);
                this.importedService = EmailService[source as keyof typeof EmailService];
            },
            configureCloudsponge: function () {
                if (window.cloudsponge) {
                    window.cloudsponge.init({
                        afterSubmitContacts: this.importContacts
                    });
                } else {
                    setTimeout(this.configureCloudsponge, 500);
                }
            }
        },
        computed: {
            loading(): boolean {
                return !this.authLoaded;
            },
            referralLink(): string | undefined {
                if (this.member) {
                    return generateReferralLink({
                        member: this.member,
                        utm_source: 'cactus.app',
                        utm_medium: 'invite-friends',
                        domain: Config.domain
                    });
                }
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
    @import "transitions";

    .content {
        flex-grow: 1;
        padding: 2.4rem;
    }

    .find-friends {
        max-width: 70rem;
    }

    .subtext {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

    .referral-link {
        margin-bottom: 3.2rem;
        position: relative;
    }

    .link-input {
        display: none;

        @include r(600) {
            @include textInput;
            color: $lightText;
            display: block;
            margin-bottom: 1.6rem;
            max-width: none;
            padding-right: 9rem;
            width: 100%;
        }
    }

    .invitetxt {
        @include r(600) {
            display: none;
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

            &.secondary {
                background-color: transparent;
                border: 0;
            }

            &:active {
                background-color: $darkGreen;
                color: $white;
            }
        }
    }

    .btnContainer {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;

        @include r(600) {
            flex-flow: row wrap;
            justify-content: flex-start;
            margin-left: -.6rem;
        }

        .btn {
            align-items: center;
            display: flex;
            justify-content: center;
            margin-bottom: .8rem;
            width: 100%;

            @include r(600) {
                flex-grow: 0;
                margin: 0 .4rem;
                width: auto;
            }
        }

        .icon {
            height: 2rem;
            margin-right: .8rem;
            width: 2rem;
        }
    }

    .results h2 {
        margin: 4.8rem 0 .8rem;
    }


</style>
