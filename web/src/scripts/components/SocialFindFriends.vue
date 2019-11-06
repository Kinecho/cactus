<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="SocialFindFriends">
        <div class="loading" v-if="loading">
            <Spinner message="Loading"/>
        </div>
      <!-- find your friends -->
        <div class="find-friends">
            <h1>Invite Friends</h1>
            <p class="label">
                Use this link to share Cactus with friends and family.
            </p>
            <div class="referral-link">
                <input type="text" class="link-input" name="referral-link" :value="referralLink" disabled="true">
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

            <!-- if not imported -->
            <div class="results" v-if="!importedContacts">
                <h2>Import from...</h2>
                <div class="btnContainer">
                    <button class="secondary small cloudsponge-launch" data-cloudsponge-source="gmail">Gmail</button>
                    <button class="secondary small cloudsponge-launch" data-cloudsponge-source="yahoo">Yahoo</button>
                </div>
                <p class="subtext">Don't worry, you'll choose which of your contacts to invite.</p>
                <!-- end -->
            </div>

            <div class="results" v-if="importedContacts">
                <h2>{{importedService}} Contacts <span class="resultCount">({{importedContacts.length}})</span></h2>
                <div class="contactCards" v-for="contact in importedContacts">
                    <SocialImportedContact v-bind:contact="contact"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
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

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);

    export default Vue.extend({
        components: {
            SocialImportedContact
        },
        created() {
            AddressBookService.sharedInstance.start();

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
            importedService: string | undefined            
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
            importContacts: function(contacts: Array<any>, source: string) {
                this.importedContacts = AddressBookService.sharedInstance.formatContacts(contacts);
                this.importedService = EmailService[source as keyof typeof EmailService];
            },
            configureCloudsponge: function() {
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

    .find-friends {
        margin: 0 auto;
        max-width: 70rem;
    }

    .label {
        display: block;
        margin-bottom: 3.2rem;
    }

    .loading {
        display: flex;
        justify-content: center;
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
            padding-right: 9rem;
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
            }

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
