<template>
    <div class="contactCard" v-if="!sent">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(name) + '.png'" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <strong v-if="name">{{name}}<br></strong>
            {{email}}
        </div>
        <div class="status">          
            <div>
                <button class="small primary" @click="sendRequest">
                    Add
                </button>
                <button class="small secondary" @click="">
                    Ignore
                </button>
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
    import {SocialConnectionRequest} from "@shared/models/SocialConnection";
    import SocialConnectionRequestService from '@web/services/SocialConnectionRequestService';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';


    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
        },
        props: {
            member: {type: Object as () => CactusMember},
            friendProfile: {type: Object as () => MemberProfile}
        },
        beforeMount() {
            
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
        watch: {
            
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
                        return (result ? true : false);                      
                    } catch(e) {
                        return false;
                    }
                } else {
                    return false;
                }
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
