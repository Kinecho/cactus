<template>
    <div class="socialFriendList">
        <div class="first-friend" v-if="referredByProfile && 
                                        !isConnection(referredByProfile.cactusMemberId) && 
                                        !isSentRequest(referredByProfile.cactusMemberId) && 
                                        !isReceivedRequest(referredByProfile.cactusMemberId)">
            People you may know
            <friend-add
                v-bind:member="member"
                v-bind:friendProfile="referredByProfile"
                v-bind:key="referredByProfile.memberId" 
            />
        </div>
        <div v-if="receivedFriendRequests.length > 0 || sentFriendRequests.length > 0">
            <h2>Friend Requests</h2>
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
        </div> 
        <div v-if="friends.length > 0">
            <h2>Your Friends</h2>
            <friend 
                v-for="(connection, index) in friends"
                v-bind:member="member"
                v-bind:connection="connection"
                v-bind:key="connection.friendMemberId" 
            />
        </div> 
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from '@shared/copy/CopyService';
    import {ElementCopy} from '@shared/copy/CopyTypes';
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import MemberProfileService from "@web/services/MemberProfileService";
    import SocialFriend from "@components/SocialFriend.vue";
    import SocialFriendRequest from "@components/SocialFriendRequest.vue";
    import SocialFriendAdd from "@components/SocialFriendAdd.vue";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import SocialConnection, {SocialConnectionRequest, 
                              SocialConnectionRequestFields, 
                              SocialConnectionFields} from "@shared/models/SocialConnection";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            friend: SocialFriend,
            friendRequest: SocialFriendRequest,
            friendAdd: SocialFriendAdd
        },
        props: {
            member: {type: Object as () => CactusMember},
        },
        created() {
        },
        data(): {
            receivedFriendRequests: Array<SocialConnectionRequest>,
            sentFriendRequests: Array<SocialConnectionRequest>,
            friends: Array<SocialConnection>,
            receivedFriendRequestsUnsubscriber?: ListenerUnsubscriber,
            sentFriendRequestsUnsubscriber?: ListenerUnsubscriber,
            friendsUnsubscriber?: ListenerUnsubscriber,
            referredByProfile?: MemberProfile
        } {
            return {
                receivedFriendRequests: [],
                sentFriendRequests: [],
                friends: [],
                receivedFriendRequestsUnsubscriber: undefined,
                sentFriendRequestsUnsubscriber: undefined,
                friendsUnsubscriber: undefined,
                referredByProfile: undefined
            }
        },
        computed: {
     
        },
        watch: {
            member: async function() {
                if (this.member.id) {
                    this.receivedFriendRequestsUnsubscriber = SocialConnectionRequestService.sharedInstance.observeReceivedConnectionRequests(this.member.id, {
                            onData: async (socialConnectionRequests: SocialConnectionRequest[]): Promise<void> => {
                                this.receivedFriendRequests = socialConnectionRequests;
                            }
                        });

                    this.sentFriendRequestsUnsubscriber = SocialConnectionRequestService.sharedInstance.observeSentConnectionRequests(this.member.id, {
                            onData: async (socialConnectionRequests: SocialConnectionRequest[]): Promise<void> => {
                                this.sentFriendRequests = socialConnectionRequests;
                            }
                        });
                    
                    this.friendsUnsubscriber = SocialConnectionService.sharedInstance.observeConnections(this.member.id, {
                            onData: async (socialConnections: SocialConnection[]): Promise<void> => {
                                this.friends = socialConnections;
                            }
                        });

                    if (this.member.referredByEmail) {
                        this.referredByProfile = await MemberProfileService.sharedInstance.getByEmail(this.member.referredByEmail);
                    }
                }
            }
        },
        methods: {
            isConnection(friendId: string): boolean {
                if (this.friends) {
                    for(let x=0; x < this.friends.length; x++) {
                        if (this.friends[x].friendMemberId == friendId) {
                            return true;
                        }
                    }
                }
                return false;
            },
            isSentRequest(friendId: string): boolean {
                if (this.sentFriendRequests) {
                    for(let x=0; x < this.sentFriendRequests.length; x++) {
                        if (this.sentFriendRequests[x].friendMemberId == friendId) {
                            return true;
                        }
                    }
                }
                return false;
            },
            isReceivedRequest(friendId: string): boolean {
                if (this.receivedFriendRequests) {
                    for(let x=0; x < this.receivedFriendRequests.length; x++) {
                        if (this.receivedFriendRequests[x].memberId == friendId) {
                            return true;
                        }
                    }
                }
                return false;
            }    
        },
        destroyed() {
            if (this.friendsUnsubscriber) {
                this.friendsUnsubscriber();
            }
            if (this.receivedFriendRequestsUnsubscriber) {
                this.receivedFriendRequestsUnsubscriber();
            }
            if (this.sentFriendRequestsUnsubscriber) {
                this.sentFriendRequestsUnsubscriber();
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .socialFriendList {
        width: 80rem;
    }
    @import "social";

</style>
