<template>
    <div class="addNewFriends" v-if="hasSuggestedFriends || hasFriendRequests">
        <section class="youMayKnow" v-if="referredByProfile && hasSuggestedFriends">
            <h4>People you may know</h4>
            <friend-add
                    v-bind:member="member"
                    v-bind:friendProfile="referredByProfile"
                    v-bind:key="referredByProfile.memberId"
            />
        </section>
        <section class="friendRequests" v-if="hasFriendRequests">
            <h4>Friend Requests</h4>
            <friend-request
                    v-for="(connection, index) in receivedFriendRequests"
                    v-bind:member="member"
                    v-bind:connectionRequest="connection"
                    v-bind:key="connection.memberId"
            />
            <friend-request
                    v-for="(connection, index) in sentFriendRequests"
                    v-bind:member="member"
                    v-bind:connectionRequest="connection"
                    v-bind:key="connection.friendMemberId"
            />
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import MemberProfileService from "@web/services/MemberProfileService";
    import SocialFriend from "@components/SocialFriend.vue";
    import SocialFriendRequest from "@components/SocialFriendRequest.vue";
    import SocialFriendAdd from "@components/SocialFriendAdd.vue";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import SocialConnection from "@shared/models/SocialConnection";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import {SocialConnectionRequest} from "@shared/models/SocialConnectionRequest"

    export default Vue.extend({
        components: {
            friend: SocialFriend,
            friendRequest: SocialFriendRequest,
            friendAdd: SocialFriendAdd
        },
        props: {
            member: {type: Object as () => CactusMember},
        },
        data(): {
            receivedFriendRequests: Array<SocialConnectionRequest>,
            sentFriendRequests: Array<SocialConnectionRequest>,
            friends: Array<SocialConnection>,
            receivedFriendRequestsUnsubscriber?: ListenerUnsubscriber,
            sentFriendRequestsUnsubscriber?: ListenerUnsubscriber,
            friendsUnsubscriber?: ListenerUnsubscriber,
            referredByUnsubscriber?: ListenerUnsubscriber,
            referredByProfile?: MemberProfile
        } {
            return {
                receivedFriendRequests: [],
                sentFriendRequests: [],
                friends: [],
                receivedFriendRequestsUnsubscriber: undefined,
                sentFriendRequestsUnsubscriber: undefined,
                referredByUnsubscriber: undefined,
                friendsUnsubscriber: undefined,
                referredByProfile: undefined
            }
        },
        async beforeMount() {
            await this.setupQueries(this.member);

            try {
                let otherFriend = await SocialConnectionRequestService.sharedInstance.getByMemberId("neil");
                console.log("Fetched other friend that doesn't belong to me", otherFriend);
            } catch (error) {
                console.error("Failed to get social connection by memberid that doesn't belong", error);
            }

        },
        watch: {
            async member(newMember: CactusMember, oldMember?: CactusMember) {
                await this.setupQueries(newMember, oldMember)
            }
        },
        computed: {
            hasSuggestedFriends: function (): boolean {
                if (this.referredByProfile &&
                    !this.isConnection(this.referredByProfile.cactusMemberId) &&
                    !this.isSentRequest(this.referredByProfile.cactusMemberId) &&
                    !this.isReceivedRequest(this.referredByProfile.cactusMemberId)) {
                    return true;
                }
                return false;
            },
            hasFriendRequests: function (): boolean {
                if (this.receivedFriendRequests.length > 0 || this.sentFriendRequests.length > 0) {
                    return true;
                }
                return false;
            }
        },
        methods: {
            async setupQueries(member: CactusMember, oldMember?: CactusMember) {
                if (member.id && member.id !== oldMember?.id) {
                    this.receivedFriendRequestsUnsubscriber?.();
                    this.receivedFriendRequestsUnsubscriber = SocialConnectionRequestService.sharedInstance.observeReceivedConnectionRequests(member.id, {
                        onData: async (socialConnectionRequests: SocialConnectionRequest[]): Promise<void> => {
                            this.receivedFriendRequests = socialConnectionRequests;
                        }
                    });

                    this.sentFriendRequestsUnsubscriber?.();
                    this.sentFriendRequestsUnsubscriber = SocialConnectionRequestService.sharedInstance.observeSentConnectionRequests(member.id, {
                        onData: async (socialConnectionRequests: SocialConnectionRequest[]): Promise<void> => {
                            this.sentFriendRequests = socialConnectionRequests;
                        }
                    });

                    this.friendsUnsubscriber?.();
                    this.friendsUnsubscriber = SocialConnectionService.sharedInstance.observeConnections(member.id, {
                        onData: async (socialConnections: SocialConnection[]): Promise<void> => {
                            this.friends = socialConnections;
                        }
                    });

                }
                if (member.referredByEmail && member.referredByEmail !== oldMember?.referredByEmail) {
                    this.referredByUnsubscriber?.();
                    this.referredByUnsubscriber = MemberProfileService.sharedInstance.observeByEmail(member.referredByEmail, {
                        onData: (profile) => {
                            this.referredByProfile = profile;
                        }
                    })
                }
            },
            isConnection(friendId: string): boolean {
                if (this.friends) {
                    for (let x = 0; x < this.friends.length; x++) {
                        if (this.friends[x].friendMemberId == friendId) {
                            return true;
                        }
                    }
                }
                return false;
            },
            isSentRequest(friendId: string): boolean {
                if (this.sentFriendRequests) {
                    for (let x = 0; x < this.sentFriendRequests.length; x++) {
                        if (this.sentFriendRequests[x].friendMemberId == friendId) {
                            return true;
                        }
                    }
                }
                return false;
            },
            isReceivedRequest(friendId: string): boolean {
                if (this.receivedFriendRequests) {
                    for (let x = 0; x < this.receivedFriendRequests.length; x++) {
                        if (this.receivedFriendRequests[x].memberId == friendId) {
                            return true;
                        }
                    }
                }
                return false;
            },
            unsubscribeQueries() {
                this.friendsUnsubscriber?.();
                this.receivedFriendRequestsUnsubscriber?.();
                this.sentFriendRequestsUnsubscriber?.();
                this.referredByUnsubscriber?.();
            }
        },
        destroyed() {
            this.unsubscribeQueries();
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .addNewFriends {
        @include shadowbox;
        background-color: lighten($lightestGreen, 5%);
        margin: 0 -1.6rem 4.8rem;
        padding: 1.6rem;

        @include r(600) {
            margin: 0 0 6.4rem;
            padding: 2.4rem;
        }

        &:empty {
            display: none;
        }
    }

    section:first-child {
        margin-top: .8rem;
    }

    section + section {
        margin-top: 4.8rem;
    }

</style>
