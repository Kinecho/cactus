<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="contactCard" :class="{inviting: readyToInvite, isFriend: isFriend, canAddFriend: canAddFriend, canInvite: canInviteContact, isPendingFriend: (wasFriended || isPendingFriend) }">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(contact.email) + '.png'" alt="User avatar"/>
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
        <div class="status" v-if="sendingInvite">
            Sending...
        </div>
        <div class="status" v-if="wasInvited">
            <svg class="statusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
            Invited
        </div>
        <div class="status error" v-if="error">
            Not Sent
        </div>
        <button class="secondary small" v-if="canAddFriend" @click="sendFriendRequest">
            <span>Add Friend</span>
        </button>
        <div class="status" v-if="wasFriended || isPendingFriend">
            <svg class="statusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#29A389" d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1zm0 2a9 9 0 100 18 9 9 0 000-18zm0 2a1 1 0 011 1v5.382l3.447 1.724a1 1 0 01-.894 1.788l-4-2A1 1 0 0111 12V6a1 1 0 011-1z"/></svg>
            Requested
        </div>
        <div class="status" v-if="isFriend">
            <svg class="statusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
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
        async created() {
            if (this.contact?.email) {
                const contactMember = await MemberProfileService.sharedInstance.getByEmail(this.contact.email);
                if (contactMember?.id) {
                    this.contactMemberProfile = contactMember;
                }
            }
        },
        destroyed() {
        },
        data(): {
            message: string,
            contactMemberProfile: MemberProfile | undefined,
            readyToInvite: boolean,
            sendingInvite: boolean,
            wasInvited: boolean,
            wasFriended: boolean,
            error: string | undefined,
            inputNameModalVisible: boolean
        } {
            return {
              message: '',
              contactMemberProfile: undefined,
              readyToInvite: false,
              sendingInvite: false,
              wasInvited: false,
              wasFriended: false,
              error: undefined,
              inputNameModalVisible: false
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
                        !this.sendingInvite &&
                        !this.error &&
                        !this.wasFriended &&
                        !this.isFriend &&
                        !this.isPendingFriend);
            },
            canInviteContact(): boolean {
                return (!this.readyToInvite &&
                        !this.wasInvited &&
                        !this.isExistingMember);
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";
    @import "~styles/social";

    .contactCard.inviting {
        align-items: flex-start;
    }

</style>
