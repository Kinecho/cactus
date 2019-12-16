<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="contactCard" :class="{inviting: readyToInvite, isFriend: isFriend, canAddFriend: canAddFriend, canInvite: canInviteContact, isPendingFriend: (wasFriended || isPendingFriend) }">
        <div class="avatar">
            <img :src="avatarUrl" alt="Avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">{{contact.first_name}} {{contact.last_name}}</p>
            <p class="email">{{contact.email}}</p>
            <div class="invite" v-if="readyToInvite && !sendingInvite && !error">
                <textarea placeholder="Include an optional note..." v-model="message" />
                <button class="primary" @click="sendInvite">Send Invite</button>
                <button class="tertiary" @click="endInvite">Cancel</button>
            </div>
        </div>
        <button class="secondary small" v-if="canInviteContact" @click="beginInvite">
            <span>Invite...</span>
        </button>
        <div class="status" v-if="isLoading">
            Importing...
        </div>
        <div class="status" v-if="sendingInvite">
            Sending...
        </div>
        <div class="status" v-if="wasInvited">
            <img class="statusIcon" src="assets/images/check.svg" alt="" />
            Invited
        </div>
        <div class="status error" v-if="error">
            Not Sent
        </div>
        <button class="secondary small addFriend" v-if="canAddFriend" @click="sendFriendRequest">
            Add <span>Friend</span>
        </button>
        <div class="status" v-if="isYou">
            You!
        </div>
        <div class="status" v-if="wasFriended || isPendingFriend">
            <img class="statusIcon" src="assets/images/clock.svg" alt="" />
            Requested
        </div>
        <div class="status" v-if="isFriend">
            <img class="statusIcon" src="assets/images/check.svg" alt="" />
            Friends
        </div>
        <input-name-modal
            :showModal="inputNameModalVisible"
            @close="hideInputNameModal"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {EmailContact} from "@shared/types/EmailContactTypes";
    import {InviteResult} from "@shared/types/SocialInviteTypes";
    import {sendInvite} from '@web/social';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import InputNameModal from "@components/InputNameModal.vue";
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import MemberProfileService from "@web/services/MemberProfileService";
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import {notifyFriendRequest} from '@web/social';
    import {SocialConnectionRequest} from "@shared/models/SocialConnectionRequest"

    export default Vue.extend({
        props: {
            contact: {type: Object as () => EmailContact},
            member: {type: Object as () => CactusMember},
            friendMemberIds: {type: Array},
            sentFriendMemberIds: {type: Array}
        },
        components: {
            InputNameModal
        },
        async beforeMount() {
            this.isLoading = true;
            if (this.contact?.email) {
                const contactMember = await MemberProfileService.sharedInstance.getByEmail(this.contact.email);
                if (contactMember?.id) {
                    this.contactMemberProfile = contactMember;
                }
            }
            this.isLoading = false;
        },
        data(): {
            message: string,
            contactMemberProfile: MemberProfile | undefined,
            readyToInvite: boolean,
            sendingInvite: boolean,
            wasInvited: boolean,
            wasFriended: boolean,
            error: string | undefined,
            inputNameModalVisible: boolean,
            isLoading: boolean,
        } {
            return {
              message: '',
              contactMemberProfile: undefined,
              readyToInvite: false,
              sendingInvite: false,
              wasInvited: false,
              wasFriended: false,
              error: undefined,
              inputNameModalVisible: false,
              isLoading: false
            }
        },
        methods: {
            async sendInvite(): Promise<void> {
                this.sendingInvite = true;

                const sendInviteResult = await sendInvite(this.contact, this.message);

                if (sendInviteResult.data && sendInviteResult.data.success) {
                    this.sendingInvite = false;
                    this.wasInvited = true;
                    this.readyToInvite = false;
                    this.error = undefined;
                    return;
                } else {
                    this.sendingInvite = false;
                    this.wasInvited = false;
                    this.readyToInvite = true;
                    this.error = sendInviteResult.message;
                    return;
                }
            },
            async sendFriendRequest() {
                if (this.member?.id && this.contactMemberProfile?.cactusMemberId) {
                    try {
                        this.sendingInvite = true;

                        const existingRequest = await SocialConnectionRequestService.sharedInstance.getByMemberAndFriendIds(this.member.id, this.contactMemberProfile.cactusMemberId);

                        if (!existingRequest) {
                            let connectionRequest = new SocialConnectionRequest();
                                connectionRequest.memberId = this.member.id;
                                connectionRequest.friendMemberId = this.contactMemberProfile.cactusMemberId;
                                connectionRequest.sentAt = new Date();

                            const result = await SocialConnectionRequestService.sharedInstance.save(connectionRequest);
                            this.wasFriended = true;
                            this.sendingInvite = false;

                            const notifyResult = await notifyFriendRequest(connectionRequest);

                            return !!result;
                        }
                        return true;
                    } catch(e) {
                        console.error("Failed to send friend request", e);
                        this.error = 'Something went wrong';
                        this.sendingInvite = false;
                        return false;
                    }
                } else {
                    return false;
                }
            },
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            },
            beginInvite() {
                if (!this.member.getFullName()) {
                    this.inputNameModalVisible = true;
                } else {
                    this.readyToInvite = true;
                }
            },
            endInvite() {
                this.readyToInvite = false;
            },
            hideInputNameModal() {
                this.inputNameModalVisible = false;
                this.readyToInvite = true;
            },
        },
        computed: {
            isExistingMember(): boolean {
                return (this.contactMemberProfile ? true : false);
            },
            isFriend(): boolean {
                return this.contactMemberProfile && this.friendMemberIds ? (this.friendMemberIds.includes(this.contactMemberProfile.cactusMemberId)) : false;
            },
            isPendingFriend(): boolean {
                return this.contactMemberProfile && this.sentFriendMemberIds ? (this.sentFriendMemberIds.includes(this.contactMemberProfile.cactusMemberId)) : false;
            },
            canAddFriend(): boolean {
                return (this.isExistingMember &&
                        !this.isLoading &&
                        !this.sendingInvite &&
                        !this.error &&
                        !this.wasFriended &&
                        !this.isFriend &&
                        !this.isPendingFriend &&
                        !this.isYou);
            },
            canInviteContact(): boolean {
                return (!this.isLoading &&
                        !this.readyToInvite &&
                        !this.wasInvited &&
                        !this.isExistingMember &&
                        !this.isYou);
            },
            isYou(): boolean {
                return (this.contact.email == this.member?.email);
            },
            avatarUrl(): string {
                if (this.contactMemberProfile?.avatarUrl) {
                    return this.contactMemberProfile.avatarUrl;
                } else {
                    return 'assets/images/avatars/avatar' + this.avatarNumber(this.contact.email) + '.png';
                }
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";
    @import "~styles/social";

    .contactCard {
        grid-template-columns: 5.2rem 1fr max-content;

        @include r(600) {
            grid-template-columns: 5.2rem 1fr 12rem;
        }

        &.inviting {
            align-items: flex-start;
        }
    }

    .addFriend span,
    .statusIcon {
        display: none;

        @include r(374) {
            display: inline;
        }
    }

    .secondary {
        white-space: nowrap;
    }

    .canAddFriend {
        order: 1;
    }
    .canInvite {
        order: 2;
    }
    .isPendingFriend {
        order: 3;
    }
    .isFriend {
        order: 4;
    }

</style>
