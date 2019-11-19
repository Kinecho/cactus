<template>
    <div class="socialFriendList">
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
    import SocialFriend from "@components/SocialFriend.vue";
    import SocialFriendRequest from "@components/SocialFriendRequest.vue";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnection, {SocialConnectionFields} from "@shared/models/SocialConnection";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            friend: SocialFriend,
            friendRequest: SocialFriendRequest
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
            friendsUnsubscriber?: ListenerUnsubscriber
        } {
            return {
                friendRequests: [],
                friends: [],
                friendRequestsUnsubscriber: undefined,
                friendsUnsubscriber: undefined
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
                }
            }
        },
        methods: {
        
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
