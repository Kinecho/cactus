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
            <svg class="statusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#29A389" d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1zm0 2a9 9 0 100 18 9 9 0 000-18zm0 2a1 1 0 011 1v5.382l3.447 1.724a1 1 0 01-.894 1.788l-4-2A1 1 0 0111 12V6a1 1 0 011-1z"/></svg>
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
    import {SocialConnectionRequest} from "@shared/models/SocialConnectionRequest"


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
