<template>
    <div class="invite-friends">
        <div class="cta" v-if="!showInviteForm">
            <h2>Mindful Friends</h2>
            <p>Your mindfulness journey is more effective when you share it with others.</p>
            <button @click="showInviteForm = true">Invite a Friend</button>
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

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
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
