<template>
    <div class="contactCard">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(email) + '.png'" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <strong v-if="name">{{name}}<br></strong>
            {{email}}
        </div>
        <div class="status">
            <div v-if="received">
                <button class="small primary" @click="confirmRequest">
                    Confirm
                </button>
                <button class="small secondary" @click="ignoreRequest">
                    Ignore
                </button>
            </div>
            <div v-if="!received">
                Pending Confirmation
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from '@shared/copy/CopyService';
    import {ElementCopy} from '@shared/copy/CopyTypes';
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import SocialConnection, {SocialConnectionRequest} from "@shared/models/SocialConnection";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import MemberProfileService from '@web/services/MemberProfileService';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';


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
            }
        },
        watch: {

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
    @import "social";

    .contactInfo {
        flex-grow: 1;
    }

</style>
