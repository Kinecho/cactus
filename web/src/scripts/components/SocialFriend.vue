<template>
    <div class="contactCard">
        <div class="avatar">
            <img :src="avatarURL" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name" v-if="name">{{name}}</p>
            <p class="email">{{email}}</p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import SocialConnection from "@shared/models/SocialConnection";
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import MemberProfileService from '@web/services/MemberProfileService';

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
            avatarURL(): string {
                if (this.friendProfile?.avatarUrl) {
                    return this.friendProfile.avatarUrl
                }
                return `/assets/images/avatars/avatar/${this.avatarNumber(this.email)}.png`
            }
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

</style>
