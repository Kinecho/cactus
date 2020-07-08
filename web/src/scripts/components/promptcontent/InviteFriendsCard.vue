<template>
    <div class="prompt-content-card">
        <div class="cta" v-if="!showInviteForm">
            <SocialActivityCard
                    avatarUrl="/assets/images/avatars/blobatar1.png"
                    date="7 minutes ago"
                    name="Aaron Nichols"
                    promptQuestion="Who energizes you?"/>
            <h2>Mindful Friends</h2>
            <p class="subtext">Your mindfulness journey is more effective when you share it with&nbsp;others.</p>
            <button class="button" @click="switchToInvite()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="#fff" d="M12 14a5 5 0 015 5v2a1 1 0 01-2 0v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a1 1 0 01-2 0v-2a5 5 0 015-5zm8-7a1 1 0 011 1l-.001 1.999L23 10a1 1 0 01.993.883L24 11a1 1 0 01-1 1l-2.001-.001L21 14a1 1 0 01-.883.993L20 15a1 1 0 01-1-1l-.001-2.001L17 12a1 1 0 01-.993-.883L16 11a1 1 0 011-1l1.999-.001L19 8a1 1 0 01.883-.993zM8.5 2a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/>
                </svg>
                Invite a Friend
            </button>
        </div>
        <div class="inviting" v-if="showInviteForm">
            <h2>Invite a Friend</h2>
            <p class="subtext">They'll get just one email inviting them to&nbsp;Cactus.</p>
            <template v-if="!wasInvited">
                <div class="formItem">
                    <input v-model="emailAddress" @blur="validateEmail()" type="text" placeholder="Email address"/>
                    <div class="alert error" v-if="validEmail === false">That email doesn't look quite&nbsp;right.</div>
                </div>
                <div class="formItem">
                    <textarea v-model="message" placeholder="Optional message" rows="4"/>
                </div>
            </template>
            <div class="buttonContainer">
                <button class="button" @click="sendInvite()" v-if="!sendingInvite && !wasInvited">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                        <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                    </svg>
                    Invite
                </button>
                <button class="button" disabled="true" v-if="sendingInvite">
                    Sending...
                </button>
                <div class="alert success" v-if="wasInvited">Invitation sent!</div>
                <button class="button tertiary" @click="reset()" v-if="!wasInvited">
                    Cancel
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { EmailContact } from "@shared/types/EmailContactTypes";
    import { sendInvite } from "@web/social";
    import { isValidEmail } from "@shared/util/StringUtil";
    import SocialActivityCard from "@components/SocialActivityCard.vue";

    @Component({
        components: {
            SocialActivityCard
        }
    })
    export default class InviteFriendsCard extends Vue {
        name = "InviteFriendsCard";


        showInviteForm: boolean = false;
        emailAddress: string = "";
        message: string = "";
        validEmail: boolean = true;
        sendingInvite: boolean = false;
        wasInvited: boolean = false;
        error: string | null = null;

        async sendInvite(): Promise<void> {
            this.validateEmail();

            if (this.validEmail) {
                this.sendingInvite = true;

                const contact: EmailContact = {
                    first_name: '',
                    last_name: '',
                    email: this.emailAddress
                };

                const sendInviteResult = await sendInvite(contact, this.message);

                if (sendInviteResult.success) {
                    this.sendingInvite = false;
                    this.wasInvited = true;
                    this.error = null;
                    setTimeout(() => this.skip(), 1500);
                    return;
                } else {
                    this.sendingInvite = false;
                    this.wasInvited = false;
                    this.error = sendInviteResult.message ?? null;
                    return;
                }
            }
        }

        validateEmail() {
            if (isValidEmail(this.emailAddress)) {
                this.validEmail = true;
            } else {
                this.validEmail = false;
            }
        }

        skip() {
            this.$emit("next");
        }

        reset() {
            this.showInviteForm = false;
        }

        switchToInvite() {
            this.showInviteForm = true;
            this.$emit("disableNavigation");
        }
    }
</script>

<style scoped lang="scss">
    @import "prompts";
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";

    .activityCard {
        background-color: white;
        border: 0;
        border-radius: 12px;
        box-shadow: 0 5px 11px -3px rgba(0, 0, 0, 0.08);
        margin: 0 0 3.2rem;

        @include r(374) {
            margin: 0 2.4rem 3.2rem;
        }
    }

    h2 {
        font-size: 3.2rem;
    }

    .subtext {
        margin: 0 0 2.4rem;
    }

    .button {
        align-items: center;
        display: flex;
        justify-content: center;
        margin: 0 auto;
        min-width: 22rem;

        &:disabled {
            position: relative;

            &:before {
                bottom: 0;
                left: 2.4rem;
                top: 1.2rem;
            }
        }

        svg {
            height: 2rem;
            margin-right: .8rem;
            width: 2rem;
        }
    }

    .formItem {
        margin-bottom: 1.6rem;
        padding: 0 1.6rem;
    }

    input {
        @include textInputAlt;
        width: 100%;
    }

    textarea {
        @include textAreaAlt;
        max-width: none;
        width: 100%;
    }

    .error {
        margin: .8rem 0 2.4rem;
        padding: 1.6rem;
        font-size: 1.8rem;
    }

    .buttonContainer {
        display: flex;
        padding: 0 1.6rem;

        .button {
            min-width: 0;

            &.tertiary:hover {
                background-color: transparent;
            }
        }
    }

</style>