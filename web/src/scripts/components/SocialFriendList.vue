<template>
    <div class="socialFriendList">
        <div v-if="friendRequests.length > 0">
            <h2>Friend Requests</h2>
            <friend 
                v-for="(friend, index) in friendRequests"
                v-bind:member="member"
                v-bind:friend="friend"
                v-bind:key="friend.memberId" 
            />
        </div> 
        <div v-if="suggestedFriends.length > 0">
            <h2>Suggested Friends</h2>
            <friend 
                v-for="(friend, index) in suggestedFriends"
                v-bind:member="member"
                v-bind:friend="friend"
                v-bind:key="friend.friendId" 
            />
        </div> 
        <div v-if="friends.length > 0">
            <h2>Your Friends</h2>
            <friend 
                v-for="(friend, index) in friends"
                v-bind:member="member"
                v-bind:friend="friend"
                v-bind:key="friend.friendId" 
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
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnection, {SocialConnectionFields} from "@shared/models/SocialConnection";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            friend: SocialFriend
        },
        props: {
            member: {type: Object as () => CactusMember},
        },
        created() {
        },
        data(): {
            suggestedFriends: Array<any>,
            friendRequests: Array<any>,
            friends: Array<any>
        } {
            return {
                suggestedFriends: [],
                friendRequests: [],
                friends: []
            }
        },
        computed: {
            
        },
        watch: {
            member: async function() {
                if (this.member.id) {
                    this.friendRequests = await SocialConnectionService.sharedInstance.getRequestedConnections(this.member.id);
                    this.friends = await SocialConnectionService.sharedInstance.getConfirmedAndPendingConnections(this.member.id);
                }
            }
        },
        methods: {
        
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
