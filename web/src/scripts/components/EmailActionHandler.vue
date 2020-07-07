<template>
    <div class="root centered">
        <NavBar/>
        <div class="loading" v-if="loading">
            <div>
                <Spinner message="Loading..."/>
            </div>
        </div>
        <div class="centered wrapper" v-else>
            <div class="success alert" v-if="successMessage">
                {{successMessage}}
            </div>
            <div class="error alert" v-if="error">
                {{error}}
            </div>
            <section v-if="mode === 'recoverEmail'" class="recoverEmail">
                <h2>Recover Email</h2>
            </section>
            <section v-if="mode === 'resetPassword' && !showPasswordResetButton" class="resetPassword">
                <form v-on:submit.prevent="handleResetPassword">
                    <h2>Change Password</h2>
                    <p>{{email}}</p>
                    <input type="password" v-model="newPassword" placeholder="New Password"/>
                    <button :class="['button', {loading: submitting}]" :disabled="submitting" @click.prevent="handleResetPassword">
                        Save New Password
                    </button>
                </form>

            </section>
            <section v-if="mode === 'verifyEmail'" class="verifyEmail">
            </section>

            <section v-if="showPasswordResetButton">
                <form v-on:submit.prevent="sendPasswordResetEmail">
                    <input type="email" v-model="passwordResetEmail" placeholder="Email Address"/>
                    <button :class="['button', {loading: submitting}]" :disabled="submitting" @click.prevent="sendPasswordResetEmail">
                        Reset Password
                    </button>
                </form>
            </section>


            <a class="button" v-show="showContinueButton" :href="continueUrl">{{continueText}}</a>
        </div>

    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue"
    import {getAllQueryParams, getQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import {EmailActionMode, getAuth} from '@web/firebase'
    import {PageRoute} from '@shared/PageRoutes'
    import {appendQueryParams} from '@shared/util/StringUtil'
    import Spinner from "@components/Spinner.vue"
    import {SourceApp} from "@shared/api/SignupEndpointTypes"
    import Logger from "@shared/Logger";

    const logger = new Logger("EmailActionHandler.vue");

    export default Vue.extend({
        components: {
            NavBar: NavBar,
            Spinner,
        },
        async beforeMount(): Promise<void> {
            const mode: EmailActionMode | null | undefined = getQueryParam(QueryParam.MODE) as EmailActionMode | undefined | null;
            const actionCode = getQueryParam(QueryParam.OOB_CODE);
            const continueUrl = getQueryParam(QueryParam.CONTINUE_URL);
            const lang = getQueryParam(QueryParam.LANG);
            const apiKey = getQueryParam(QueryParam.API_KEY);
            this.mode = mode;
            this.actionCode = actionCode;
            this.continueUrl = continueUrl || PageRoute.MEMBER_HOME;
            this.lang = lang;

            switch (mode) {
                case EmailActionMode.recoverEmail:
                    await this.handleRecoverEmail();
                    this.loading = false;
                    break;
                case EmailActionMode.resetPassword:
                    await this.verifyPasswordResetCode();
                    this.loading = false;
                    break;
                case EmailActionMode.verifyEmail:
                    await this.handleVerifyEmail();
                    this.loading = false;
                    break;
                case EmailActionMode.signIn:
                    const sourceApp = getQueryParam(QueryParam.SOURCE_APP) as SourceApp;
                    logger.log("app source", sourceApp);
                    const isSignIn = getAuth().isSignInWithEmailLink(window.location.href);

                    if (isSignIn && sourceApp === SourceApp.ios) {
                        let appUrl = `${PageRoute.NATIVE_APP_MAGIC_LINK_LOGIN}`;
                        appUrl = appendQueryParams(appUrl, getAllQueryParams());
                        window.location.assign(appUrl);
                        return;
                    }

                    const continueUrl = getQueryParam(QueryParam.CONTINUE_URL) || PageRoute.LOGIN;
                    let url = appendQueryParams(continueUrl, {
                        [QueryParam.MODE]: mode,
                        [QueryParam.API_KEY]: apiKey,
                        [QueryParam.CONTINUE_URL]: continueUrl,
                        [QueryParam.OOB_CODE]: actionCode,
                        [QueryParam.LANG]: lang,
                    });
                    window.location.assign(url);
                    break;
                default:
                    logger.error("No valid code was found");
                    this.error ="Invalid link.";
                    this.loading = false;
                    this.showContinueButton = true;
                    this.continueUrl = "/";
                    this.continueText = "Go Home";
                    break;
            }

        },
        data(): {
            mode?: EmailActionMode | null,
            actionCode?: string | null,
            lang?: string | null,
            continueUrl?: string | null,
            email?: string | null,
            newPassword?: string | undefined | null,
            error?: string,
            showContinueButton: boolean,
            successMessage?: string,
            showPasswordResetButton: boolean,
            passwordResetEmail?: string | null,
            submitting: boolean,
            loading: boolean,
            continueText: string,
        } {
            return {
                mode: undefined,
                actionCode: undefined,
                lang: undefined,
                continueUrl: undefined,
                email: undefined,
                newPassword: undefined,
                error: undefined,
                showContinueButton: false,
                successMessage: undefined,
                showPasswordResetButton: false,
                passwordResetEmail: undefined,
                submitting: false,
                loading: true,
                continueText: "Continue",
            }
        },
        methods: {
            async sendPasswordResetEmail() {

                const email = this.passwordResetEmail;
                if (!email) {
                    this.error = "Unable to send password rest email. Your email address is not known.";
                    return;
                }

                this.submitting = true;
                await getAuth().sendPasswordResetEmail(email);
                this.successMessage = `Password reset email has been sent to ${email}`;
                this.error = undefined;
                this.submitting = false;
            },


            async handleRecoverEmail() {

                if (!this.actionCode) {
                    this.error = "Oops! This link is not properly formatted. Try the email recovery flow again.";

                    return;
                }

                // Localize the UI to the selected language as determined by the lang
                // parameter.
                const auth = getAuth();
                var restoredEmail: string | null = null;
                this.submitting = true;
                try {
                    // Confirm the action code is valid.
                    const info: any = await auth.checkActionCode(this.actionCode);
                    // Get the restored email address.
                    restoredEmail = info['data']['email'] as string | null;
                    try {
                        // Revert to the old email.
                        await auth.applyActionCode(this.actionCode);
                        // Account email reverted to restoredEmail

                        // TODO: Display a confirmation message to the user.


                        this.successMessage = `Successfully recovered your email address: ${restoredEmail}. You may want to reset your password now.`;
                        this.submitting = false;
                        // You might also want to give the user the option to reset their password
                        this.passwordResetEmail = restoredEmail;
                        this.showPasswordResetButton = true;

                        this.error = undefined;
                    } catch (revertError) {
                        logger.error(revertError);
                        this.successMessage = undefined;
                        this.error = "Unable to recover your email address. Please try again later";
                        this.submitting = false;
                    }

                } catch (invalidCodeError) {
                    logger.error(invalidCodeError);
                    this.successMessage = undefined;
                    this.error = "This link is either invalid or expired. Please try again.";
                    this.submitting = false;
                }


            },
            async verifyPasswordResetCode(): Promise<string | undefined> {
                try {
                    if (!this.actionCode) {
                        this.error = "Oops! This link is not properly formatted. Try to reset your password again.";
                        return;
                    }
                    const auth = getAuth();
                    const email = await auth.verifyPasswordResetCode(this.actionCode);
                    return email
                } catch (verifyError) {
                    logger.error(verifyError);
                    this.error = "This link is invalid or has expired. Please try to reset the password again.";
                    this.showPasswordResetButton = true;
                    this.successMessage = undefined;
                    return;
                }

            },

            async handleVerifyEmail() {
                // Localize the UI to the selected language as determined by the lang
                // parameter.
                // Try to apply the email verification code.

                const auth = getAuth();

                if (!this.actionCode) {
                    this.error = "This link is not formatted properly. Please try again.";
                    return;
                }

                try {
                    const resp: any = await auth.applyActionCode(this.actionCode);
                    this.showContinueButton = true;
                    this.successMessage = "Your email has been verified successfully!";
                } catch (error) {
                    // Code is invalid or expired. Ask the user to verify their email address
                    // again.
                    this.error = "This link is invalid or has expired.";
                    this.showPasswordResetButton = true;
                    this.successMessage = undefined;
                }
            },

            async handleResetPassword() {
                // Localize the UI to the selected language as determined by the lang
                // parameter.


                if (!this.actionCode) {
                    this.error = "Oops! This link is not properly formatted. Try to reset your password again.";

                    return;
                }

                if (!this.newPassword || this.newPassword.length < 6) {
                    this.error = "Your new password must be at least 6 characters"
                    return;
                }
                this.submitting = true;
                const auth = getAuth();
                try {

                    // Verify the password reset code is valid.
                    const email = await this.verifyPasswordResetCode();
                    if (!email) {
                        return;
                    }
                    // TODO: Show the reset screen with the user's email and ask the user for
                    // the new password.
                    try {

                        // Save the new password.
                        const resp = await auth.confirmPasswordReset(this.actionCode, this.newPassword || "");
                        // Password reset has been confirmed and new password updated.
                        logger.log("confirm password reset response", resp);
                        // TODO: Display a link back to the app, or sign-in the user directly
                        // if the page belongs to the same domain as the app:
                        await auth.signInWithEmailAndPassword(email, this.newPassword);

                        // TODO: If a continue URL is available, display a button which on
                        // click redirects the user back to the app via continueUrl with
                        // additional state determined from that URL's parameters.
                        if (this.continueUrl) {
                            this.showContinueButton = true;
                        }
                        this.successMessage = `Password changed successfully. You are now logged in as ${email}.`;
                        this.newPassword = "";
                        this.mode = undefined;
                        this.showContinueButton = true;
                        this.submitting = false;
                        // Error occurred during confirmation. The code might have expired or the
                        // password is too weak.
                    } catch (confirmError) {
                        logger.error(confirmError);
                        this.error = "Unable to save password: " + confirmError.message;
                        this.successMessage = undefined;
                    }
                } catch (verifyError) {
                    // Invalid or expired action code. Ask user to try to reset the password
                    // again.
                    logger.error(verifyError);
                    this.error = "This link is invalid or has expired. Please try to reset the password again.";
                    this.showPasswordResetButton = true;
                    this.successMessage = undefined;
                    // this.passwordResetEmail = email
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "mixins";
    @import "variables";

    .root {
        background-color: transparent;
        min-height: 100vh;
    }

    .loading {
        margin-top: 20rem;
    }


    .wrapper {
        @include shadowbox;
        margin: 3rem auto;
        max-width: 60rem;
        padding: 3rem;

        .alert {
            padding: 1rem;
            border-radius: 1rem;
            border-width: 0px;
            border-style: solid;
            margin-bottom: 2rem;

            &.error {
                background-color: $pink;
                color: $darkestPink;
                border-color: $darkestPink;
            }

            &.success {
                background-color: $lightGreen;
                color: $darkestGreen;
                border-color: $darkestGreen;
            }
        }
    }

    section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        h1, h2, h3 {
            margin-bottom: 1.6rem;
        }

        input, input[type=password] {
            margin-bottom: 1.2rem;
            margin-right: 0;
        }

        button {
            margin-top: 1rem;
        }
    }
</style>