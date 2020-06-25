<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="socialFindFriends">

        <!-- suggested friends / friend requests -->
        <div class="socialFriendNotifications" v-if="member">
            <social-friend-notifications v-bind:member="member"/>
        </div>

        <!-- find your friends -->
        <div class="find-friends">
            <h2>Invite friends to reflect</h2>
            <p class="subtext">Share your unique link.</p>
            <div class="referral-link">
                <input type="text" class="link-input" name="referral-link" :value="referralLink" disabled="true"/>
                <button class="copy" v-clipboard:copy="referralLink"
                        v-clipboard:success="handleCopySuccess"
                        v-clipboard:error="handleCopyError">
                    <span v-if="copySucceeded === true">Copied!</span>
                    <span v-if="copySucceeded === false">Copy <span class="invitetxt">Invite</span> Link</span>
                </button>
            </div>

            <!-- if not imported -->
            <div class="results" v-if="!importedContacts">
                <h2>Find Friends</h2>
                <p class="subtext">Invite your contacts and connect on Cactus.</p>
                <div class="emailbtnContainer" v-if="!isImporting">
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
                <div v-if="isImporting">
                    <Spinner />
                </div>
                <!-- end -->
            </div>
            <div class="results" v-if="importedContacts">
                <h2>{{importedService}} Contacts <span class="resultCount">({{importedContacts.length}})</span></h2>
                <template v-for="importedContact in importedContacts">
                    <SocialImportedContact
                            :imported_contact="importedContact"
                            :member="member" />
                </template>
            </div>
        </div>

        <!-- Friend List -->
        <div class="socialFriendList">
            <friend-list v-bind:member="member"/>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";
    import AddressBookService from '@web/services/AddressBookService'
    import SocialImportedContact from "@components/SocialImportedContact.vue"
    import {EmailService, CloudspongeContact} from "@shared/types/EmailContactTypes";
    import {ImportedContact} from "@shared/types/ImportedContactTypes";
    import CactusMember from "@shared/models/CactusMember";
    import {Config} from "@web/config";
    import {generateReferralLink} from '@shared/util/SocialInviteUtil';
    import SocialFriendList from "@components/SocialFriendList.vue";
    import SocialFriendNotifications from "@components/SocialFriendNotifications.vue";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnection from "@shared/models/SocialConnection";
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import ImportedContactService from '@web/services/ImportedContactService';
    import SocialConnectionRequest from "@shared/models/SocialConnectionRequest";

    export default Vue.extend({
        components: {
            Spinner,
            SocialImportedContact,
            FriendList: SocialFriendList,
            SocialFriendNotifications
        },
        async beforeMount() {
            if (this.member?.id) {
                const [friends, sentRequests] = await Promise.all([
                    SocialConnectionService.sharedInstance.getByMemberId(this.member.id), 
                    SocialConnectionRequestService.sharedInstance.getSentByMemberId(this.member.id)
                ]);

                if (friends) {
                    this.friendMemberIds = friends.map((sc: SocialConnection) => { return sc.friendMemberId });
                }
                if (sentRequests) {
                    this.sentFriendMemberIds = sentRequests.map((scr: SocialConnectionRequest) => { return scr.friendMemberId });
                }

            }
            
            AddressBookService.sharedInstance.start();
        },
        mounted() {
            this.configureCloudsponge();
        },
        props: {
            member: {
                type: Object as () => CactusMember,
                required: true,
            }
        },
        data(): {
            authLoaded: boolean,
            friendMemberIds: string[],
            sentFriendMemberIds: string[],
            copySucceeded: boolean,
            importedContacts: ImportedContact[] | undefined,
            importedService: string | undefined,
            customNetworks: { [key: string]: { sharer: string, type: "popup" | "direct" } },
            isImporting: boolean
        } {
            return {
                authLoaded: false,
                friendMemberIds: [],
                sentFriendMemberIds: [],
                copySucceeded: false,
                importedContacts: undefined,
                importedService: undefined,
                customNetworks: {
                    email: {
                        "sharer": "mailto:?subject=@title&body=@url%0D%0A%0D%0A@description",
                        "type": "popup"
                    }
                },
                isImporting: false
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
            async importContacts(contacts: Array<CloudspongeContact>, source: string) {
                this.isImporting = true;
                const formattedContacts = AddressBookService.sharedInstance.formatContacts(contacts);
                this.importedContacts = await ImportedContactService.sharedInstance.prepareImportedContacts(
                    formattedContacts, 
                    this.friendMemberIds, 
                    this.sentFriendMemberIds, 
                );
                this.importedService = EmailService[source as keyof typeof EmailService];
                this.isImporting = false;
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

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";
    @import "transitions";

    h1 {
        margin-bottom: 4rem;
    }

    .socialFindFriends {
        margin: 0 auto;
        max-width: 60rem;

        @include r(960) {
            display: grid;
            grid-column-gap: 6.4rem;
            grid-template-columns: 1fr minmax(38rem, 33%);
            grid-template-rows: max-content 1fr;
            margin: 0;
            max-width: none;
        }
    }

    .find-friends {
        margin-bottom: 4.8rem;

        @include r(600) {
            grid-column: 1;
            grid-row: 1 / 3;
            margin-bottom: 6.4rem;
        }
    }

    .subtext {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

    .referral-link {
        margin-bottom: 3.2rem;
        max-width: 60rem;
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

    .results {
        display: flex;
        flex-direction: column;

        h2 {
            margin: 4.8rem 0 .8rem;

            @include r(600) {
                margin: 6.4rem 0 .8rem;
            }
        }
    }

</style>
