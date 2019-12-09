<template>
    <div class="contactCard" v-if="!sent">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(name) + '.png'" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name" v-if="name">{{name}}</p>
            <p class="email">{{email}}</p>
        </div>
        <button class="small secondary" @click="sendRequest">
            Add
        </button>
        <!-- <button class="small secondary" @click="ignoreRequest">
            Hide
        </button> -->
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import {notifyFriendRequest} from '@web/social';
    import {SocialConnectionRequest} from "@shared/models/SocialConnectionRequest"

    export default Vue.extend({
        props: {
            member: {type: Object as () => CactusMember},
            friendProfile: {type: Object as () => MemberProfile}
        },
        data(): {
            sent: boolean
        } {
            return {
                sent: false
            }
        },
        computed: {
            name() {
                return this.friendProfile.getFullName();
            },
            email() {
                return this.friendProfile.email;
            },
        },
        methods: {
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            },
            async sendRequest() {
                if (this.member?.id && this.friendProfile?.cactusMemberId) {
                    try {
                        let connectionRequest = new SocialConnectionRequest();
                            connectionRequest.memberId = this.member.id;
                            connectionRequest.friendMemberId = this.friendProfile.cactusMemberId;
                            connectionRequest.sentAt = new Date();

                        const result = await SocialConnectionRequestService.sharedInstance.save(connectionRequest);
                        this.sent = true;

                        const notifyResult = await notifyFriendRequest(connectionRequest);

                        return !!result;
                    } catch(e) {
                        console.error("Failed to notify friend request", e);
                        return false;
                    }
                } else {
                    return false;
                }
            },
            ignoreRequest(): boolean {
                return false;
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
