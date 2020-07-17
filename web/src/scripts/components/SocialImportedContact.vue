<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="contactCard" :class="{inviting: readyToInvite}">
        <div class="contactAvatar" v-if="avatarUrl">
            <img :src="avatarUrl" alt="Avatar"/>
        </div>
        <div class="contactInfo" v-if="contact">
            <p class="name">{{contact.first_name}} {{contact.last_name}}</p>
            <p class="contactEmail">{{contact.email}}</p>
            <div class="invite" v-if="readyToInvite && !sendingInvite && !error">
                <textarea placeholder="Include an optional note..." v-model="message"/>
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
            <img class="statusIcon" src="/assets/images/check.svg" alt=""/>
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
            <img class="statusIcon" src="/assets/images/clock.svg" alt=""/>
            Requested
        </div>
        <div class="status" v-if="isFriend">
            <img class="statusIcon" src="/assets/images/check.svg" alt=""/>
            Friends
        </div>
        <input-name-modal
                :showModal="inputNameModalVisible"
                @close="hideInputNameModal"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { EmailContact } from "@shared/types/EmailContactTypes";
    import { notifyFriendRequest, sendInvite } from '@web/social';
    import { getIntegerFromStringBetween } from '@shared/util/StringUtil';
    import InputNameModal from "@components/InputNameModal.vue";
    import CactusMember from "@shared/models/CactusMember";
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import SocialConnectionRequest from "@shared/models/SocialConnectionRequest"
    import { ImportedContact } from "@shared/types/ImportedContactTypes";
    import Logger from "@shared/Logger";

    const logger = new Logger("SocialImportedContact.vue");
    export default Vue.extend({
        props: {
            imported_contact: {
                type: Object as () => ImportedContact, required: true
            },
            member: {
                type: Object as () => CactusMember, required: true
            },
        },
        components: {
            InputNameModal
        },
        data(): {
            contact: EmailContact,
            message: string,
            readyToInvite: boolean,
            sendingInvite: boolean,
            wasInvited: boolean,
            wasFriended: boolean,
            error: string | undefined,
            inputNameModalVisible: boolean,
            isLoading: boolean,
        } {
            return {
                contact: this.imported_contact.email_contact,
                message: '',
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
                if (this.contact) {
                    this.sendingInvite = true;

                    const sendInviteResult = await sendInvite(this.contact, this.message);

                    if (sendInviteResult.success) {
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
                }
            },
            async sendFriendRequest(): Promise<boolean> {
                if (this.member?.id && this.imported_contact?.memberId) {
                    try {
                        this.sendingInvite = true;

                        const existingRequest = await SocialConnectionRequestService.sharedInstance.getByMemberAndFriendIds(this.member.id, this.imported_contact.memberId);

                        if (!existingRequest) {
                            let connectionRequest = new SocialConnectionRequest();
                            connectionRequest.memberId = this.member.id;
                            connectionRequest.friendMemberId = this.imported_contact.memberId;
                            connectionRequest.sentAt = new Date();

                            const result = await SocialConnectionRequestService.sharedInstance.save(connectionRequest);
                            this.wasFriended = true;
                            this.sendingInvite = false;

                            const notifyResult = await notifyFriendRequest(connectionRequest);

                            return !!result;
                        }
                        return true;
                    } catch (e) {
                        logger.error("Failed to send friend request", e);
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
                return this.imported_contact?.statuses?.isMember ? true : false
            },
            isFriend(): boolean {
                return this.imported_contact?.statuses?.isFriend ? true : false
            },
            isPendingFriend(): boolean {
                return this.imported_contact?.statuses?.isRequested ? true : false
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
                return ((this.contact && this.contact.email == this.member?.email) ? true : false);
            },
            avatarUrl(): string | undefined {
                if (this.imported_contact?.avatarUrl) {
                    return this.imported_contact.avatarUrl;
                } else if (this.contact) {
                    return '/assets/images/avatars/avatar' + this.avatarNumber(this.contact.email) + '.png';
                }
                return;
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "transitions";
    @import "social";

    .contactCard {
        grid-template-columns: 5.2rem 1fr max-content;
        grid-template-rows: auto;
        @include r(600) {
            grid-template-columns: 5.2rem 1fr 12rem;
            grid-template-rows: auto;
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

</style>
