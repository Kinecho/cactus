<template>
    <div class="socialFriendList">
        <div class="first-friend" v-if="referredByProfile && !isConnection(referredByProfile.cactusMemberId)">
            People you may know
            <friend-add
                v-bind:member="member"
                v-bind:friendProfile="referredByProfile"
                v-bind:key="referredByProfile.memberId" 
            />
        </div>
        <div v-if="friendRequests.length > 0">
            <h2>Friend Requests</h2>
            <friend-request 
                v-for="(connection, index) in friendRequests"
                v-bind:member="member"
                v-bind:connectionRequest="connection"
                v-bind:key="connection.memberId" 
            />
        </div> 
        <div v-if="friends.length > 0">
            <h2>Your Friends</h2>
            <friend 
                v-for="(connection, index) in friends"
                v-bind:member="member"
                v-bind:connection="connection"
                v-bind:key="connection.friendId" 
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
    import SocialConnection, {SocialConnectionFields} from "@shared/models/SocialConnection";
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
            friendRequests: Array<any>,
            friends: Array<any>,
            friendRequestsUnsubscriber?: ListenerUnsubscriber,
            friendsUnsubscriber?: ListenerUnsubscriber,
            referredByProfile?: MemberProfile
        } {
            return {
                friendRequests: [],
                friends: [],
                friendRequestsUnsubscriber: undefined,
                friendsUnsubscriber: undefined,
                referredByProfile: undefined
            }
        },
        computed: {
     
        },
        watch: {
            member: async function() {
                if (this.member.id) {
                    this.friendRequestsUnsubscriber = SocialConnectionService.sharedInstance.observeRequestedConnections(this.member.id, {
                            onData: async (socialConnections: SocialConnection[]): Promise<void> => {
                                this.friendRequests = socialConnections;
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
                        if (this.friends[x].memberId == friendId || this.friends[x].friendId == friendId) {
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
            if (this.friendRequestsUnsubscriber) {
                this.friendRequestsUnsubscriber();
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

</style>
