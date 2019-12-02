<template>
    <section class="yourFriends" v-if="friends.length > 0">
        <h2>Friends</h2>
        <friend
            v-for="(connection, index) in friends"
            v-bind:member="member"
            v-bind:connection="connection"
            v-bind:key="connection.friendMemberId"
        />
    </section>
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
        },
        props: {
            member: {type: Object as () => CactusMember},
        },
        created() {
        },
        data(): {
            friends: Array<SocialConnection>,
            friendsUnsubscriber?: ListenerUnsubscriber,
        } {
            return {
                friends: [],
                friendsUnsubscriber: undefined,
            }
        },
        computed: {

        },
        watch: {
            member: async function() {
                if (this.member.id) {
                    this.friendsUnsubscriber = SocialConnectionService.sharedInstance.observeConnections(this.member.id, {
                            onData: async (socialConnections: SocialConnection[]): Promise<void> => {
                                this.friends = socialConnections;
                            }
                        }
                    );
                }
            }
        },
        methods: {

        },
        destroyed() {
            if (this.friendsUnsubscriber) {
                this.friendsUnsubscriber();
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    h2 {
        @include r(768) {
            font-size: 3.2rem;
        }
    }
</style>
