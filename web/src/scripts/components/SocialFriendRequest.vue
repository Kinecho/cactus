<template>
    <div class="contactCard" v-if="!confirmed">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(name) + '.png'" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            {{name}}
        </div>
        <div class="status">          
            <div>
                <button class="small primary" @click="confirmRequest">
                    Confirm
                </button>
                <button class="small secondary" @click="ignoreRequest">
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
    import SocialConnection, {SocialConnectionStatus} from "@shared/models/SocialConnection";
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';


    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
        },
        props: {
            member: {type: Object as () => CactusMember},
            connectionRequest: {type: Object as () => SocialConnection}
        },
        beforeMount() {
            
        },
        data(): {
        } {
            return {
            }
        },
        computed: {
            name() {
                return this.connectionRequest.friendId;
            },
            confirmed() {
                return this.connectionRequest.confirmed;
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
            },
            async confirmRequest() {
                try {
                    const result = await SocialConnectionService.sharedInstance.confirm(this.connectionRequest);
                    return (result ? true : false);                      
                } catch(e) {
                    return false;
                }
            },
            ignoreRequest(): boolean {
                return false;
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
