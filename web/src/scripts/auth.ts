import {Config} from "@web/config";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {showConfirmEmailModal, addModal, LocalStorageKey, showModal} from "@web/util";
import {initializeFirebase, getAuth, FirebaseUserCredential} from "@web/firebase";
import * as firebaseui from "firebaseui";
import {PageRoute} from "@web/PageRoutes";
import AuthUI = firebaseui.auth.AuthUI;

const firebase = initializeFirebase();

let authUi: AuthUI;


export interface EmailLinkSignupResult {
    success: boolean,
    credential?: FirebaseUserCredential,
    error?: {
        title: string,
        message: string,
        friendlyMessage?: string
    }
    continue?: {
        title: string,
        url: string,
    }
}

export const emailProvider = (opts: any) => ({
    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
    forceSameDevice: false,
    emailLinkSignIn: function () {
        return {
            signInSuccessWithAuthResult: function (authResult: any, redirectUrl: string | undefined) {
                console.log("signin from auth link success", authResult);

                authResult.additionalUserInfo.isNewUser;
                if (redirectUrl) {
                    console.log("redirecting to redirect url", redirectUrl);
                    // window.location = redirectUrl;
                }
                return false;
            },
            // Additional state showPromo=1234 can be retrieved from URL on
            // sign-in completion in signInSuccess callback by checking
            // window.location.href.
            url: `${Config.domain}${opts.emailLinkSignInPath}`,
            continueUrl: `${Config.domain}${PageRoute.SIGNUP}`,
            // Custom FDL domain.
            dynamicLinkDomain: `${Config.firebaseDynamicLink.domain}`,
            // Always true for email link sign-in.
            handleCodeInApp: true,

        };
    }
});

function getPhoneProviderConfig() {
    return {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
            type: 'image', // 'audio'
            size: 'invisible', // 'invisible' or 'compact' or 'normal'
            badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
        },
        defaultCountry: 'US', // Set default country to the United Kingdom (+44).
        defaultNationalNumber: '1234567890',
    };
}

export interface AuthUIConfigOptions {
    signInSuccessPath: string,
    emailLinkSignInPath?: string,
    signInSuccess?: ((authResult: FirebaseUserCredential, redirectUrl: string) => boolean),
    signInFailure?: ((error: firebaseui.auth.AuthUIError) => Promise<void>)
}


export function getAuthUIConfig(opts: AuthUIConfigOptions): firebaseui.auth.Config {
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
                    console.log("Sign in success. No callback was provided", authResult, redirectUri);
                    return true;
                }
            },
            async signInFailure(error: firebaseui.auth.AuthUIError): Promise<void> {
                console.error("Sign in failure", error);
                if (opts.signInFailure) {
                    opts.signInFailure(error);
                } else {
                    console.error("No signin failure callback provided")
                }
                return
            }
        },
        signInSuccessUrl: opts.signInSuccessPath,
        signInFlow: 'redirect',
        credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // getPhoneProviderConfig(),
            // emailProvider(opts)

        ],
        // tosUrl: 'https://www.kinecho.com/terms-of-service',
        // privacyPolicyUrl: 'https://kinecho.com/policies/privacy'
    }
}


export function getAuthUI(): firebaseui.auth.AuthUI {
    if (authUi) {
        return authUi;
    }

    // Initialize the FirebaseUI Widget using Firebase.
    authUi = new firebaseui.auth.AuthUI(firebase.auth());
    return authUi;

}


export function createAuthModal(): string {
    const modalId = 'auth-modal';
    addModal(modalId, {});

    const ui = getAuthUI();
    ui.start(`#${modalId} > div`, getAuthUIConfig({
        signInSuccessPath: PageRoute.SIGNUP_CONFIRMED,
        emailLinkSignInPath: PageRoute.SIGNUP_CONFIRMED
    }));
    return modalId;
}

export async function handleEmailLinkSignIn(error?: string): Promise<EmailLinkSignupResult> {
    const isSignIn = firebase.auth().isSignInWithEmailLink(window.location.href);
    if (!isSignIn) {
        console.log("isSignIn is false");
        return {success: true};
    }

    let email: string | undefined | null = window.localStorage.getItem(LocalStorageKey.emailForSignIn);
    const currentUser = getAuth().currentUser;
    if (currentUser) {
        console.log("using current user's email");
        email = currentUser.email
    }

    if (!email) {
        const {email: confirmedEmail, canceled} = await showConfirmEmailModal({
            title: "Confirm email",
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
        console.log("got confirmed email", email);
    }

    if (email) {
        try {
            const authResult: FirebaseUserCredential = await firebase.auth().signInWithEmailLink(email, window.location.href);
            window.localStorage.removeItem(LocalStorageKey.emailForSignIn);
            const resultUser = authResult.user;


            if (resultUser) {
                console.log("successfully completed sign in ", resultUser.toJSON());
            }

            return {success: true, credential: authResult}

        } catch (error) {
            console.error("failed to login with email", error);
            if (error.code === "auth/invalid-email") {
                return handleEmailLinkSignIn("The email you entered does not match the email used to sign in.");
            } else if (error.code === "auth/invalid-action-code") {
                return {
                    success: false,
                    error: {
                        title: "Oh Oh!",
                        message: "This link is invalid. This can happen if the link is malformed, expired, or has already been used."
                    },
                    continue: {
                        title: "Sign In",
                        url: PageRoute.SIGNUP,
                    }
                };
            }

            return {success: false, error: error.message};
        }
    } else {
        return {success: false, error: {title: "Whoops!", message: "Unable to complete your registration"}}
    }
}

export async function sendEmailLinkSignIn(subscription: SubscriptionRequest): Promise<EmailLinkSignupResult> {
    const email = subscription.email;
    try {
        await firebase.auth().sendSignInLinkToEmail(email, {
            url: `${Config.domain}${PageRoute.SIGNUP_CONFIRMED}`,
            handleCodeInApp: true,
        });
        window.localStorage.setItem(LocalStorageKey.emailForSignIn, email);
        return {success: true};
    } catch (error) {
        console.error("failed to send signin link", error);
        return {success: false, error,}
    }
}