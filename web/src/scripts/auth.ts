import {Config} from "@web/config";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {showConfirmEmailModal, addModal, LocalStorageKey, showModal} from "@web/util";
import {initializeFirebase, getAuth, getFirebase} from "@web/firebase";
import * as firebaseui from "firebaseui";

const firebase = initializeFirebase();

let authUi;

export function getAuthUIConfig(opts:{signinSuccessPath:string, emailLinkSigninPath?:string}) {
    return {
        signInSuccessUrl: opts.signinSuccessPath,
        signInFlow: 'redirect',
        credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            {
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
                        url: `${Config.domain}${opts.emailLinkSigninPath}`,
                        continueUrl: `${Config.domain}/signup`,
                        // Custom FDL domain.
                        dynamicLinkDomain: `${Config.firebaseDynamicLink.domain}`,
                        // Always true for email link sign-in.
                        handleCodeInApp: true,

                    };
                }
            },
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // firebase.auth.GithubAuthProvider.PROVIDER_ID,
            // firebase.auth.EmailAuthProvider.PROVIDER_ID,
            {
                provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                recaptchaParameters: {
                    type: 'image', // 'audio'
                    size: 'invisible', // 'invisible' or 'compact' or 'normal'
                    badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
                },
                defaultCountry: 'US', // Set default country to the United Kingdom (+44).
                defaultNationalNumber: '1234567890',
            },
        ],
        // tosUrl: 'https://www.kinecho.com/terms-of-service',
        // privacyPolicyUrl: 'https://kinecho.com/policies/privacy'
    }
};

export interface EmailLinkSignupResult {
    success: boolean,
    error?: any,
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
    ui.start(`#${modalId} > div`, getAuthUIConfig({signinSuccessPath: "/confirmed", emailLinkSigninPath: "/confirmed"}));
    return modalId;
}

export async function handleEmailLinkSignIn(error?:string): Promise<EmailLinkSignupResult> {
    const isSignIn = firebase.auth().isSignInWithEmailLink(window.location.href);
    if (!isSignIn) {
        return {success: true};
    }

    let email = window.localStorage.getItem(LocalStorageKey.emailForSignIn);
    if (!email) {
        const {email: confirmedEmail, canceled} = await showConfirmEmailModal({
            title: "Confirm email",
            message: "Please enter the email address that you signed up with",
            error,
        });
        if (canceled){
            return {success:false, error: "Unable to confirm your subscription"};
        }
        email = confirmedEmail;
        console.log("got confirmed email", email);
    }

    if (email){
        try {
            const authResult = await firebase.auth().signInWithEmailLink(email, window.location.href);
            window.localStorage.removeItem(LocalStorageKey.emailForSignIn);
            console.log("successfully completed sign in ", authResult.user.toJSON());
        } catch (error){
            console.error("failed to login with email", error);
            if (error.code === "auth/invalid-email"){
                return handleEmailLinkSignIn("The email you entered does not match the email used to sign in.");
            }
        }

        return {success: true}
    } else {
        return {success: false, error: "Unable to sign in"}
    }
}

export async function sendEmailLinkSignIn(subscription: SubscriptionRequest): Promise<EmailLinkSignupResult> {
    const email = subscription.email;
    try {
        await firebase.auth().sendSignInLinkToEmail(email, {
            url: `${Config.domain}/confirmed`,
            handleCodeInApp: true,
        });
        // window.localStorage.setItem(LocalStorageKey.emailForSignIn, email);
        return {success: true};
    } catch (error) {
        console.error("failed to send signin link", error);
        return {success: false, error,}
    }
}