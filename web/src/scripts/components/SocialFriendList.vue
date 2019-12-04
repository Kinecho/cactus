<template>
    <section class="yourFriends" v-if="friends.length > 0">
        <h4>Friends</h4>
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
    import CactusMember from "@shared/models/CactusMember";
    import SocialFriend from "@components/SocialFriend.vue";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnection from "@shared/models/SocialConnection";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'

    export default Vue.extend({
        components: {
            friend: SocialFriend,
        },
        props: {
            member: {
                type: Object as () => CactusMember,
                required: true
            },
        },
        beforeMount() {
            if (this.member.id) {
                this.friendsUnsubscriber = SocialConnectionService.sharedInstance.observeConnections(this.member.id, {
                        onData: async (socialConnections: SocialConnection[]): Promise<void> => {
                            this.friends = socialConnections;
                        }
                    }
                );
            }
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
        watch: {
            // member: async function() {
            //
            // }
        },
        destroyed() {
            this.friendsUnsubscriber?.();
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .yourFriends {
        border: 1px solid lighten($lightestGreen, 5%);
        border-radius: 1.2rem;
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

</style>
