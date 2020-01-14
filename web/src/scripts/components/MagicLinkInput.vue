<template>
    <form class="email-form" id="email-signup" @submit.prevent="submit">
        <div class="alert error" v-if="error">{{error}}</div>
        <input type="email" name="email" :placeholder="commonCopy.ENTER_YOUR_EMAIL_ADDRESS" v-model="email" :disabled="submitting" :class="{disabled: submitting}"/>
        <button type="submit" name="submit" v-bind:disabled="submitting" :class="['email-submit-button', {loading: submitting, disabled: submitting}]">
            {{nextCopy}}
        </button>
    </form>
</template>

<script lang="ts">
    import Vue from "vue";
    import {isValidEmail} from '@shared/util/StringUtil'
    import {sendEmailLinkSignIn} from "@web/auth"
    import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest"
    import {addModal, getQueryParam, showModal} from "@web/util"
    import {QueryParam} from "@shared/util/queryParams"
    import StorageService, {LocalStorageKey} from "@web/services/StorageService"
    import {gtag} from "@web/analytics"
    import CopyService from '@shared/copy/CopyService'
    import {CommonCopy} from '@shared/copy/CopyTypes'
    import Logger from "@shared/Logger";

    const logger = new Logger("MagicLinkInput.vue");
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {
            this.email = this.initialEmail || "";
        },
        props: {
            initialEmail: String,
            buttonText: String,
        },
        data(): {
            email: string,
            submitting: boolean,
            error: string | undefined,
            commonCopy: CommonCopy,
        } {
            return {
                email: "",
                submitting: false,
                error: undefined,
                commonCopy: copy.common,
            }
        },
        computed: {
            nextCopy(): string {
                return this.buttonText || this.commonCopy.NEXT;
            }
        },
        methods: {
            async submit(): Promise<void> {
                logger.log("MagicLinkInput.vue: submitting email");
                this.submitting = true;
                let email = (this.email || "").toLowerCase().trim();
                if (!email || email.trim().length === 0) {
                    this.error = copy.error.PLEASE_ENTER_AN_EMAIL_ADDRESS;
                    this.submitting = false;
                    return;
                }
                if (!isValidEmail(email)) {
                    this.error = copy.error.PLEASE_ENTER_A_VALID_EMAIL_ADDRESS;
                    this.submitting = false;
                    return;
                }

                try {

                    const subscription = new SubscriptionRequest(email);
                    subscription.subscriptionLocation = {page: window.location.pathname, formId: "MagicLinkInput"};

                    let referredByEmail: string | undefined = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS) || undefined;
                    if (!referredByEmail) {
                        referredByEmail = StorageService.getItem(LocalStorageKey.referredByEmail);
                    }
                    subscription.referredByEmail = referredByEmail;

                    const signupResult = await sendEmailLinkSignIn(subscription);

                    if (signupResult.success) {
                        const modalId = "signup-success-modal";
                        this.error = undefined;

                        let title = copy.exclamation(copy.common.WELCOME);
                        const message = copy.auth.magicLinkSuccess(email);
                        const imageUrl = '/assets/images/benefit4.png';

                        if (signupResult.existingEmail) {
                            title = copy.exclamation(copy.common.WELCOME_BACK);
                            // message = `Check your ${emailAddress} inbox to get your Magic Link to finish signing in.`;
                        }

                        this.$emit("success", email);

                        addModal(modalId, {
                            title,
                            message,
                            imageUrl,
                            imageAlt: 'Email Signup Success!',
                        });
                        gtag('event', 'email_signup_success', {
                            event_category: "email_signup",
                            event_label: `MagicLinkInput`
                        });
                        showModal(modalId);

                        this.email = "";

                    } else if (signupResult.error) {
                        const message = signupResult.error.friendlyMessage || copy.error.SORRY_WE_ARE_HAVING_ISSUES_TRY_AGAIN;
                        this.$emit("error", {message});
                        gtag('event', 'email_signup_error', {
                            event_category: "email_signup",
                            event_label: `MagicLinkInput`
                        });
                        this.error = message;
                    } else {
                        const message = copy.error.SORRY_WE_ARE_HAVING_ISSUES_TRY_AGAIN;
                        this.$emit("error", {message});
                        gtag('event', 'email_signup_error', {
                            event_category: "email_signup",
                            event_label: `MagicLinkInput`
                        });
                        this.error = message;
                    }
                } catch (error) {
                    const message = copy.error.SORRY_WE_ARE_HAVING_ISSUES;
                    this.$emit("sendError", {message});
                    logger.error("failed to process form", error);
                    this.error = message;
                } finally {
                    this.submitting = false;
                }

            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";


    form.email-form {
        display: flex;
        flex-flow: column wrap;
        margin: 0 auto;
        max-width: 70rem;
        padding: 2.4rem 0;

        @include r(600) {
            flex-direction: row;
            padding: 2.4rem;
        }
    }


</style>
