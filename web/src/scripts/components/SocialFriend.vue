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
            <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
            Friends
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from '@shared/copy/CopyService';
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import SocialConnection from "@shared/models/SocialConnection";
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import MemberProfileService from '@web/services/MemberProfileService';


    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
        },
        props: {
            member: {type: Object as () => CactusMember},
            connection: {type: Object as () => SocialConnection}
        },
        async beforeMount() {
            if (this.connection?.friendMemberId) {
                this.friendProfile = await MemberProfileService.sharedInstance.getByMemberId(this.connection.friendMemberId);
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
        },
        watch: {

        },
        methods: {
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "social";

</style>
