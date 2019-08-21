<template>
    <form class="email-form" id="email-signup" @submit.prevent="submit">
        <div class="alert error" v-if="error">{{error}}</div>
        <input type="email" name="email" placeholder="Enter your email address" v-model="email"/>
        <button type="submit" name="submit" v-bind:disabled="submitting" :class="['email-submit-button', {loading: submitting, disabled: submitting}]">
            Next
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

    export default Vue.extend({
        created() {

        },
        props: {},
        data(): {
            email: string,
            submitting: boolean,
            error: string | undefined,
        } {
            return {
                email: "",
                submitting: false,
                error: undefined
            }
        },
        methods: {
            async submit(): Promise<void> {
                console.log("MagicLinkInput.vue: submitting email");
                this.submitting = true;
                let email = (this.email || "").toLowerCase().trim();
                if (!email || email.trim().length === 0) {
                    this.error = "Please enter an email address";
                    this.submitting = false;
                    return;
                }
                if (!isValidEmail(email)) {
                    this.error = "Please enter a valid email address";
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

                        let title = "Welcome!";
                        const message = `To confirm your email address and securely sign in, tap the button in the email sent to ${email}.`;
                        const imageUrl = '/assets/images/success.svg';

                        if (signupResult.existingEmail) {
                            title = "Welcome back!";
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
                        const message = signupResult.error.friendlyMessage || "Sorry, it looks like we're having issues. Please try again later."
                        this.$emit("error", {message});
                        gtag('event', 'email_signup_error', {
                            event_category: "email_signup",
                            event_label: `MagicLinkInput`
                        });
                        this.error = message;
                    } else {
                        const message = "Sorry, it looks like we're having issues. Please try again later";
                        this.$emit("error", {message});
                        gtag('event', 'email_signup_error', {
                            event_category: "email_signup",
                            event_label: `MagicLinkInput`
                        });
                        this.error = message;
                    }
                } catch (error) {
                    const message = "Sorry, it looks like we're having issues.";
                    this.$emit("sendError", {message});
                    console.error("failed to process form", error);
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
