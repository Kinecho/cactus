import * as firebaseui from "firebaseui";
import {
    EmailProvider,
    FacebookProvider,
    FirebaseUserCredential,
    getAuth,
    GoogleProvider,
    PhoneProvider,
    TwitterProvider
} from "@web/firebase";
import { Config } from "@web/config";
import { addModal, getQueryParam, showConfirmEmailModal } from "@web/util";
import { QueryParam } from "@shared/util/queryParams";
import { SourceApp } from "@shared/api/SignupEndpointTypes";
import { PageRoute } from "@shared/PageRoutes";
import { LocalStorageKey } from "@web/services/StorageService";
import { EmailLinkSignupResult } from "@web/auth";
import Logger from "@shared/Logger";
import AuthUI = firebaseui.auth.AuthUI;

let authUi: AuthUI;
const logger = new Logger("authUi.ts");

export interface AuthUIConfigOptions {
    signInSuccessPath: string,
    emailLinkSignInPath?: string,
    signInSuccess?: ((authResult: FirebaseUserCredential, redirectUrl: string) => boolean),
    signInFailure?: ((error: firebaseui.auth.AuthUIError) => Promise<void>),
    uiShown?: () => void;
    includeEmailLink?: boolean,
    includeTwitter?: boolean,
}

export function getAuthUIConfig(opts: AuthUIConfigOptions): firebaseui.auth.Config {

    const signInOptions: any[] = [
        {
            provider: GoogleProvider.PROVIDER_ID,
            customParameters: {
                // Forces account selection even when one account
                // is available.
                prompt: 'select_account'
            }
        },
        FacebookProvider.PROVIDER_ID,
        "apple.com",
    ];

    if (opts.includeTwitter) {
        signInOptions.push(TwitterProvider.PROVIDER_ID);
    }

    if (opts.includeEmailLink) {
        signInOptions.push(emailProvider(opts));
    }

    return {
        callbacks: {
            signInSuccessWithAuthResult: (authResult: FirebaseUserCredential, redirectUri: string): boolean => {

                /*
                If the callback returns true, then the page is automatically redirected depending on the case:

                If no signInSuccessUrl parameter was given in the URL (See: https://github.com/firebase/firebaseui-web#overwriting-the-sign-in-success-url)
                then the default signInSuccessUrl in config is used.
                If the value is provided in the URL, that value will be used instead of the static signInSuccessUrl in config.
                If the callback returns false or nothing, the page is not automatically redirected.
                 */
                if (opts.signInSuccess) {
                    return opts.signInSuccess(authResult, redirectUri)
                } else {
                    logger.log("Sign in success. No callback was provided", authResult, redirectUri);
                    return true;
                }
            },
            async signInFailure(error: firebaseui.auth.AuthUIError): Promise<void> {
                logger.error("Sign in failure", error);
                if (opts.signInFailure) {
                    await opts.signInFailure(error);
                } else {
                    logger.error("No signin failure callback provided")
                }
                return
            },

            uiShown(): void {
                opts.uiShown && opts.uiShown();
            }
        },

        signInSuccessUrl: opts.signInSuccessPath,
        signInFlow: 'redirect',
        credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
        signInOptions,
        siteName: "Cactus",
        tosUrl: `${ Config.domain }/terms-of-service`,
        privacyPolicyUrl: `${ Config.domain }/privacy-policy`
    }
}

export function getAuthUI(): firebaseui.auth.AuthUI {
    if (authUi) {
        return authUi;
    }

    // Initialize the FirebaseUI Widget using Firebase.
    authUi = new firebaseui.auth.AuthUI(getAuth());
    return authUi;

}

export async function handleEmailLinkSignIn(error?: string): Promise<EmailLinkSignupResult> {
    const appSource = getQueryParam(QueryParam.SOURCE_APP) as SourceApp;
    const isSignIn = getAuth().isSignInWithEmailLink(window.location.href);

    if (isSignIn && (appSource === SourceApp.ios || appSource === SourceApp.android)) {
        logger.log("Source App is iOS or Android and is magic link");
        window.location.replace(`${ PageRoute.NATIVE_APP_MAGIC_LINK_LOGIN }`);

    }

    if (!isSignIn) {
        logger.log("isSignIn is false");
        return { success: true };
    }

    let email: string | undefined | null = window.localStorage.getItem(LocalStorageKey.emailForSignIn);
    const currentUser = getAuth().currentUser;
    if (currentUser) {
        logger.log("using current user's email");
        email = currentUser.email
    }

    if (!email || error) {
        const { email: confirmedEmail, canceled } = await showConfirmEmailModal({
            title: "Confirm your email",
            message: "Please enter the email address that you signed up with",
            error,
        });
        if (canceled) {
            return {
                success: false,
                error: {
                    title: "Oh no!",
                    message: "Unable to confirm your subscription.",
                },
                continue: {
                    title: "Try again",
                    url: window.location.href,
                }
            };
        }
        email = confirmedEmail;
        logger.log("got confirmed email", email);
    }

    if (email) {
        try {
            const authResult: FirebaseUserCredential = await getAuth().signInWithEmailLink(email, window.location.href);
            window.localStorage.removeItem(LocalStorageKey.emailForSignIn);
            const resultUser = authResult.user;


            if (resultUser) {
                logger.log("successfully completed sign in ", resultUser.toJSON());
            }

            return { success: true, credential: authResult }

        } catch (error) {
            logger.error("failed to login with email", error);
            if (error.code === "auth/invalid-email") {
                logger.log("invalid email error, should prompt user to confirm it");
                return handleEmailLinkSignIn("The email you entered does not match the email used to sign in.");
            } else if (error.code === "auth/invalid-action-code") {
                return {
                    success: false,
                    error: {
                        title: "Uh Oh!",
                        message: "This link is invalid. This can happen if the link is malformed, expired, or has already been used."
                    },
                    continue: {
                        title: "Sign In",
                        url: PageRoute.SIGNUP,
                    }
                };
            }

            return { success: false, error: error.message };
        }
    } else {
        return { success: false, error: { title: "Whoops!", message: "Unable to complete your registration" } }
    }
}


export const emailProvider = (opts: AuthUIConfigOptions) => ({
    provider: EmailProvider.PROVIDER_ID,
    signInMethod: EmailProvider.EMAIL_LINK_SIGN_IN_METHOD,
    forceSameDevice: false,
    emailLinkSignIn: function () {
        return {
            signInSuccessWithAuthResult: function (authResult: any, redirectUrl: string | undefined) {
                logger.log("signin from auth link success", authResult);

                authResult.additionalUserInfo.isNewUser;
                if (redirectUrl) {
                    logger.log("redirecting to redirect url", redirectUrl);
                    // window.location = redirectUrl;
                }
                return false;
            },
            // Additional state showPromo=1234 can be retrieved from URL on
            // sign-in completion in signInSuccess callback by checking
            // window.location.href.
            url: `${ opts.emailLinkSignInPath }`,
            continueUrl: `${ Config.domain }${ PageRoute.SIGNUP }`,
            // Custom FDL domain.
            dynamicLinkDomain: `${ Config.firebaseDynamicLink.domain }`,
            // Always true for email link sign-in.
            handleCodeInApp: true,

        };
    }
});

function getPhoneProviderConfig() {
    return {
        provider: PhoneProvider.PROVIDER_ID,
        recaptchaParameters: {
            type: 'image', // 'audio'
            size: 'invisible', // 'invisible' or 'compact' or 'normal'
            badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
        },
        defaultCountry: 'US', // Set default country to the United Kingdom (+44).
        defaultNationalNumber: '1234567890',
    };
}
