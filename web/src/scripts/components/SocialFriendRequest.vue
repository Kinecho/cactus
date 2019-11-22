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
                this.friendProfile = await MemberProfileService.sharedInstance.getByMemberId(this.connectionRequest.friendMemberId);  
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
