<template>
    <div class="invite-friends">
        <div class="cta" v-if="!showInviteForm">
            <SocialActivityCard
                avatarUrl="/assets/images/avatars/blobatar1.png"
                date="7 minutes ago"
                name="Aaron Nichols"
                promptContentPath="https://cactus.app/prompts/zTVQbvum95ENWV2Do3xE"
                promptQuestion="Who energizes you?"/>
            <h2>Mindful Friends</h2>
            <p class="subtext">Your mindfulness journey is more effective when you share it with others.</p>
            <button class="button" @click="showInviteForm = true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="#fff" d="M12 14a5 5 0 015 5v2a1 1 0 01-2 0v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a1 1 0 01-2 0v-2a5 5 0 015-5zm8-7a1 1 0 011 1l-.001 1.999L23 10a1 1 0 01.993.883L24 11a1 1 0 01-1 1l-2.001-.001L21 14a1 1 0 01-.883.993L20 15a1 1 0 01-1-1l-.001-2.001L17 12a1 1 0 01-.993-.883L16 11a1 1 0 011-1l1.999-.001L19 8a1 1 0 01.883-.993zM8.5 2a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/>
                </svg>
                Invite a Friend
            </button>
        </div>
        <div class="inviting" v-if="showInviteForm">
            <h2>Invite a Friend</h2>
            <div>
                <input v-model="emailAddress" @blur="validateEmail()" type="text" placeholder="Email address" /><br>
                <span class="error" v-if="validEmail === false">Email address is invalid.</span>
            </div>
            <div>
                <textarea placeholder="Optional message from you" rows="5"/>
            </div>
            <button @click="sendInvite()">Invite</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {formatDate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"
    import {isValidEmail} from "@shared/util/StringUtil"
    import {Image} from '@shared/models/PromptContent'
    import SocialActivityCard from "@components/SocialActivityCard.vue"

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            SocialActivityCard
        },
        data(): {
            resizeListener: any | undefined,
            deviceWidth: number,
            showInviteForm: boolean,
            emailAddress: string,
            validEmail: boolean | undefined,
        } {
            return {
                resizeListener: undefined,
                deviceWidth: 0,
                showInviteForm: false,
                emailAddress: '',
                validEmail: undefined
            }
        },
        destroyed() {
            if (this.resizeListener) {
                window.removeEventListener("resize", this.resizeListener);
            }
        },
        mounted() {
            this.deviceWidth = getDeviceDimensions().width;
            this.resizeListener = window.addEventListener("resize", () => {
                this.deviceWidth = getDeviceDimensions().width;
            })
        },
        methods: {
            sendInvite() {
                this.validateEmail();

                if (this.validEmail) {
                    console.log('would send invite');
                }
            },
            validateEmail() {
                if (isValidEmail(this.emailAddress)) {
                    this.validEmail = true;
                } else {
                    this.validEmail = false;
                }
            }
        }
    })
</script>


<style lang="scss" scoped>
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

    .subtext {
        margin: 0 auto 2.4rem;
        max-width: 40rem;
    }

    .button {
        align-items: center;
        display: flex;
        justify-content: center;
        margin: 0 auto;
        min-width: 22rem;

        svg {
            height: 2rem;
            margin-right: .8rem;
            width: 2rem;
        }
    }

    // .inviting {
    //     text-align: left;
    //
    //     input {
    //         width: 80%;
    //         padding: 1rem;
    //     }
    //     .add {
    //         font-size: 80%;
    //         margin: 0 0 2rem;
    //         display: block;
    //     }
    //     .error {
    //         color: red;
    //         display: block;
    //         margin: 0 0 1rem;
    //     }
    //     textarea {
    //         width: 80%;
    //         padding: 1rem;
    //     }
    //     button {
    //         margin: 3rem 0 0;
    //     }
    // }

</style>
