<template>
    <div class="contactCard">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(name) + '.png'" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            {{name}}
        </div>
        <div class="status">
            <div v-if="status == socialConnectionStatus('PENDING')">
                Pending
            </div>
            
            <div v-if="status == socialConnectionStatus('CONFIRMED')">
                <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
                Friends
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from '@shared/copy/CopyService';
    import CactusMember from "@shared/models/CactusMember";
    import MemberProfile from "@shared/models/MemberProfile";
    import SocialConnection, {SocialConnectionStatus} from "@shared/models/SocialConnection";
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
        beforeMount() {
            
        },
        async created() {
            if (this.connection) {
                const memberProfileId = this.connection.memberId == this.member.id ? this.connection.friendId : this.connection.memberId;
                if (memberProfileId) {
                    this.friendProfile = await MemberProfileService.sharedInstance.getByMemberId(memberProfileId);  
                }
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
            status(): SocialConnectionStatus {
                if (this.connection.confirmed) {
                    return SocialConnectionStatus.CONFIRMED
                } else {
                    return SocialConnectionStatus.PENDING
                }
            }, 
            name(): string|undefined {
                if (this.friendProfile) {
                    if (this.friendProfile.getFullName()) {
                        return this.friendProfile.getFullName();
                    } else {
                        return this.friendProfile.email;
                    }
                } 
                return 'Loading...';
            }          
        },
        watch: {
            
        },
        methods: {
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            },
            socialConnectionStatus(key: keyof typeof SocialConnectionStatus): string {
                return SocialConnectionStatus[key];
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .contactCard {
        align-items: center;
        display: flex;
        max-width: 60rem;
        padding: 1.6rem 0;

        button {
            flex-grow: 0;
        }

        &.inviting {
            align-items: flex-start;
        }
    }

    .contactInfo {
        flex-grow: 1;
    }

    .email {
        font-size: 1.4rem;
        max-width: 12.3rem;
        opacity: .8;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        @include r(374) {
            max-width: 17.3rem;
        }
        @include r(600) {
            max-width: none;
        }
    }

    .avatar {
        $avatarDiameter: 4.4rem;
        border-radius: 50%;
        flex-shrink: 0;
        height: $avatarDiameter;
        margin-right: .8rem;
        overflow: hidden;
        width: $avatarDiameter;

        @include r(600) {
            margin-right: 1.6rem;
        }

        img {
            width: 100%;
            height: 100%;
        }
    }

    .friendsStatus {
        align-items: center;
        color: $darkestPink;
        display: flex;

        .check {
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }
    }

    .invite {
        textarea {
            border: 1px solid $green;
            border-radius: .4rem;
            font-size: 1.6rem;
            margin: .8rem 0;
            padding: 0.8rem;
            width: 100%;
        }
    }

    .status {
        align-items: center;
        display: flex;
        font-size: 1.6rem;
        padding: 0 1.2rem;
        &.error {
            color: red;
        }
    }

    .check {
        height: 1.6rem;
        margin-right: .8rem;
        width: 1.6rem;
    }

</style>
