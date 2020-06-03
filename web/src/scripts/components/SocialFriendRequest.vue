<template>
    <div class="contactCard">
        <div class="avatar">
            <img :src="avatarURL" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name" v-if="name">{{name}}</p>
            <p class="email">{{email}}</p>
        </div>
        <button class="small secondary" @click="confirmRequest">
            Confirm
        </button>
        <div class="status" v-if="!received">
            <img class="statusIcon" src="/assets/images/clock.svg" alt="" />
            Requested
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from '@shared/copy/CopyService';
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import MemberProfileService from '@web/services/MemberProfileService';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import SocialConnectionRequest from "@shared/models/SocialConnectionRequest"


    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
        },
        props: {
            member: {type: Object as () => CactusMember},
            connectionRequest: {type: Object as () => SocialConnectionRequest}
        },
        async beforeMount() {
            if (this.connectionRequest?.friendMemberId) {
                this.friendProfile = await MemberProfileService.sharedInstance.getByMemberId(this.getFriendMemberId());
            }
        },
        data(): {
            friendProfile: MemberProfile | undefined
        } {
            return {
                friendProfile: undefined
            }
        },
        computed: {
            name(): string|undefined {
                if (this.friendProfile?.getFullName()) {
                    return this.friendProfile.getFullName();
                }
            },
            email(): string {
                return this.friendProfile?.email || '';
            },
            received(): boolean {
                return this.connectionRequest.friendMemberId == this.member.id;
            },
            avatarURL(): string {
                if (this.friendProfile?.avatarUrl) {
                    return this.friendProfile.avatarUrl
                }
                return `/assets/images/avatars/avatar${this.avatarNumber(this.email)}.png`
            }
        },
        methods: {
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            },
            async confirmRequest() {
                try {
                    const result = await SocialConnectionRequestService.sharedInstance.confirmRequest(this.connectionRequest);
                    return (result ? true : false);
                } catch(e) {
                    return false;
                }
            },
            ignoreRequest(): boolean {
                return false;
            },
            getFriendMemberId(): string {
                return this.received ? this.connectionRequest.memberId : this.connectionRequest.friendMemberId
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .btnContainer {
        flex-direction: row;

        .tertiary {
            margin-right: -1.6rem;
        }
    }

    .email {
        @include r(600) {
            max-width: 17.3rem;
        }
    }

</style>
