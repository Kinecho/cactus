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
                return `/assets/images/avatars/avatar${this.avatarNumber(this.email)}.png`
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

    .contactCard {
        border-bottom: 1px solid $lightestGreen;
        display: flex;
        font-size: 1.6rem;
        margin: 0 -2.4rem;
        padding: 1.6rem;
        text-align: left;

        @include r(374) {
            background-color: white;
            border: 0;
            border-radius: 12px;
            box-shadow: 0 5px 11px -3px rgba(0, 0, 0, 0.08);
            margin: 0 -1.6rem .4rem;
        }

        @include r(600) {
            font-size: 1.8rem;
            margin: 0 0 3.2rem;
            max-width: 64rem;
            padding: 2.4rem;

            &.demo {
                max-width: 48rem;
            }
        }

        a {
            text-decoration: none;

            &:hover {
                color: $darkestGreen;
            }
        }

        .bold {
            font-weight: bold;
        }
    }

    .email,
    .date {
        font-size: 1.4rem;
        opacity: .8;
    }

    .avatar {
        $avatarDiameter: 6.4rem;
        border-radius: 50%;
        flex-shrink: 0;
        height: $avatarDiameter;
        margin-right: 1.6rem;
        overflow: hidden;
        width: $avatarDiameter;

        img {
            width: 100%;
            height: 100%;
        }
    }

    .info button {
        margin-top: 1.6rem;
    }
</style>
