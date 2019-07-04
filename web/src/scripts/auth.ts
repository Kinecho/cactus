import {Config} from "@web/config";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {showConfirmEmailModal, addModal, LocalStorageKey, showModal} from "@web/util";
import {initializeFirebase, getAuth, getFirebase} from "@web/firebase";
import * as firebaseui from "firebaseui";

const firebase = initializeFirebase();

let authUi;


export interface EmailLinkSignupResult {
    success: boolean,
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

export const emailProvider = (opts) => ({
    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
    forceSameDevice: false,
    emailLinkSignIn: function () {
        return {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
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
            continueUrl: `${Config.domain}/signup`,
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

export function getAuthUIConfig(opts: { signInSuccessPath: string, emailLinkSignInPath?: string }) {
    return {
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
        signInSuccessPath: "/confirmed",
        emailLinkSignInPath: "/confirmed"
    }));
    return modalId;
}

export async function handleEmailLinkSignIn(error?: string): Promise<EmailLinkSignupResult> {
    const isSignIn = firebase.auth().isSignInWithEmailLink(window.location.href);
    if (!isSignIn) {
        console.log("isSignIn is false");
        return {success: true};
    }

    let email = window.localStorage.getItem(LocalStorageKey.emailForSignIn);
    if (getAuth().currentUser) {
        console.log("using current user's email");
        email = getAuth().currentUser.email
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
            const authResult = await firebase.auth().signInWithEmailLink(email, window.location.href);
            window.localStorage.removeItem(LocalStorageKey.emailForSignIn);
            console.log("successfully completed sign in ", authResult.user.toJSON());
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
                        url: "/signup",
                    }
                };
            }

            return {success: false, error: error.message};
        }

        return {success: true}
    } else {
        return {success: false, error: {title: "Whoops!", message: "Unable to complete your registration"}}
    }
}

export async function sendEmailLinkSignIn(subscription: SubscriptionRequest): Promise<EmailLinkSignupResult> {
    const email = subscription.email;
    try {
        await firebase.auth().sendSignInLinkToEmail(email, {
            url: `${Config.domain}/confirmed`,
            handleCodeInApp: true,
        });
        window.localStorage.setItem(LocalStorageKey.emailForSignIn, email);
        return {success: true};
    } catch (error) {
        console.error("failed to send signin link", error);
        return {success: false, error,}
    }
}