<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="contactCard" :class="{inviting: readyToInvite}">
        <div class="avatar">
            <img :src="'assets/images/avatars/avatar' + avatarNumber(contact.email) + '.png'" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">{{contact.first_name}} {{contact.last_name}}</p>
            <p class="email">{{contact.email}}</p>
            <div class="invite" v-if="readyToInvite && !sendingInvite && !error">
                <textarea placeholder="Include an optional note..." v-model="message" />
                <button class="primary" @click.prevent="sendInvite">Send Invite</button>
                <button class="tertiary" @click.prevent="readyToInvite = false">Cancel</button>
            </div>
        </div>
        <button class="secondary small" v-if="!readyToInvite && !wasInvited" @click.prevent="readyToInvite = true">
            <span>Invite...</span>
        </button>
        <div class="status" v-if="sendingInvite">
            Sending...
        </div>
        <div class="status" v-if="wasInvited">
            <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
            Invited
        </div>
        <div class="status error" v-if="error">
            Not Sent
        </div>

    </div>
    <!--
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <button class="secondary small">Add Friend</button>
    </div>
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <button class="secondary small">Requested</button>
    </div>
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <p class="friendsStatus">
            <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#FDBCA3" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
            Friends
        </p>
    </div>
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <button class="secondary small">Invited</button>
    </div>-->
</template>

<script lang="ts">
    import Vue from "vue";
    import {EmailContact} from "@shared/types/EmailContactTypes";
    import {InviteResult} from "@shared/types/SocialInviteTypes";
    import {sendInvite} from '@web/invite';
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';

    export default Vue.extend({
        props: {
            contact: {type: Object as () => EmailContact}
        },
        components: {

        },
        created() {
        },
        mounted() {
        },
        destroyed() {
        },

        data(): {
            message: string,
            readyToInvite: boolean,
            sendingInvite: boolean,
            wasInvited: boolean,
            error: string | undefined
        } {
            return {
              message: '',
              readyToInvite: false,
              sendingInvite: false,
              wasInvited: false,
              error: undefined
            }
        },

        methods: {
            async sendInvite(): Promise<void> {
                this.sendingInvite = true;

                const sendInviteResult = await sendInvite(this.contact, this.message);

                if (sendInviteResult.data && sendInviteResult.data.success) {
                    this.sendingInvite = false;
                    this.wasInvited = true;
                    this.readyToInvite = false;
                    this.error = undefined;
                    return;
                } else {
                    this.sendingInvite = false;
                    this.wasInvited = false;
                    this.readyToInvite = true;
                    this.error = sendInviteResult.message;
                    return;
                }
            },
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            },
        },      
    })
</script>

<style scoped lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";

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
