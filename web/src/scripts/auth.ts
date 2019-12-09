import {Config} from "@web/config";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {addModal, getAllQueryParams, getQueryParam, showConfirmEmailModal} from "@web/util";
import {AdditionalUserInfo, FirebaseUser, FirebaseUserCredential, getAuth, initializeFirebase,} from "@web/firebase";
import * as firebaseui from "firebaseui";
import {PageRoute} from "@shared/PageRoutes";
import {Endpoint, getAuthHeaders, request} from "@web/requestUtils";
import {
    EmailStatusRequest,
    EmailStatusResponse,
    LoginEvent,
    MagicLinkRequest,
    MagicLinkResponse,
    SourceApp
} from "@shared/api/SignupEndpointTypes";
import {QueryParam} from "@shared/util/queryParams";
import StorageService, {LocalStorageKey} from "@web/services/StorageService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import CactusMemberService from "@web/services/CactusMemberService";
import {fireSignupEvent, fireConfirmedSignupEvent} from "@web/analytics";
import AuthUI = firebaseui.auth.AuthUI;

const firebase = initializeFirebase();
let authUi: AuthUI;

export interface LogoutOptions {
    redirectOnSignOut: boolean,
    redirectUrl?: string
}

export const DefaultLogoutOptions = {redirectOnSignOut: true, redirectUrl: "/"};

export async function logout(options: LogoutOptions = DefaultLogoutOptions) {
    await getAuth().signOut();
    StorageService.clear();
    if (options.redirectUrl) {
        window.location.href = options.redirectUrl || '/';
    }
}

export interface EmailLinkSignupResult {
    success: boolean,
    credential?: FirebaseUserCredential,
    existingEmail?: boolean,
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

export const emailProvider = (opts: AuthUIConfigOptions) => ({
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
            url: `${opts.emailLinkSignInPath}`,
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
    signInFailure?: ((error: firebaseui.auth.AuthUIError) => Promise<void>),
    uiShown?: () => void;
    includeEmailLink?: boolean,
}


export function getAuthUIConfig(opts: AuthUIConfigOptions): firebaseui.auth.Config {
    const signInOptions = [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // getPhoneProviderConfig(),
        // emailProvider(opts)

    ];
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
                    console.log("Sign in success. No callback was provided", authResult, redirectUri);
                    return true;
                }
            },
            async signInFailure(error: firebaseui.auth.AuthUIError): Promise<void> {
                console.error("Sign in failure", error);
                if (opts.signInFailure) {
                    await opts.signInFailure(error);
                } else {
                    console.error("No signin failure callback provided")
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
        tosUrl: `${Config.domain}/terms-of-service`,
        privacyPolicyUrl: `${Config.domain}/privacy-policy`
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
    const appSource = getQueryParam(QueryParam.SOURCE_APP) as SourceApp;
    const isSignIn = firebase.auth().isSignInWithEmailLink(window.location.href);

    if (isSignIn && appSource === SourceApp.ios) {
        console.log("Source App is ios and is magic link");
        window.location.replace(`${PageRoute.IOS_MAGIC_LINK_LOGIN}`);

    }

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

    if (!email || error) {
        const {email: confirmedEmail, canceled} = await showConfirmEmailModal({
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
                console.log("invalid email error, should prompt user to confirm it");
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

            return {success: false, error: error.message};
        }
    } else {
        return {success: false, error: {title: "Whoops!", message: "Unable to complete your registration"}}
    }
}

export async function getEmailStatus(email: string): Promise<EmailStatusResponse> {
    try {
        const statusRequest: EmailStatusRequest = {email};
        const emailResponse = await request.post(Endpoint.signupEmailStatus, statusRequest);
        return emailResponse.data;
    } catch (e) {
        console.error("Failed to get the email status before sending magic link", e);
        return {
            exists: false,
            email,
            message: "Failed to get the email status",
            error: e,
        };
    }
}

export async function sendMagicLink(options: MagicLinkRequest): Promise<MagicLinkResponse> {
    try {
        const response = await request.post(Endpoint.sendMagicLink, options);
        return response.data;
    } catch (e) {
        console.error("Failed to get a success response from magic link endpoint", e);
        return {
            success: false,
            exists: false,
            email: options.email,
            message: "Failed to send magic link",
            error: e,
        }
    }
}

export function getAnonymousReflectionResponseIds(): string[] {
    const anonReflectionResponses = StorageService.getDecodeModelMap(LocalStorageKey.anonReflectionResponse, ReflectionResponse);
    return anonReflectionResponses ? Object.values(anonReflectionResponses).map(r => r.id).filter(Boolean) as string[] : [];
}

export async function sendEmailLinkSignIn(subscription: SubscriptionRequest): Promise<EmailLinkSignupResult> {
    const email = subscription.email;
    const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
    let emailLinkRedirectUrl: string = PageRoute.SIGNUP_CONFIRMED;
    if (redirectUrlParam) {
        emailLinkRedirectUrl = `${emailLinkRedirectUrl}?${QueryParam.REDIRECT_URL}=${redirectUrlParam}`
    }

    const landingParams = StorageService.getJSON(LocalStorageKey.landingQueryParams);

    console.log("Setting redirect url for email link signup to be ", emailLinkRedirectUrl);

    const statusResponse = await sendMagicLink({
        email: email,
        referredBy: subscription.referredByEmail,
        continuePath: emailLinkRedirectUrl,
        reflectionResponseIds: getAnonymousReflectionResponseIds(),
        queryParams: landingParams,
    });
    window.localStorage.setItem(LocalStorageKey.emailForSignIn, email);

    return {
        success: statusResponse.success,
        existingEmail: statusResponse.exists,
        error: statusResponse.error
    }
}

export async function sendLoginEvent(args: {
    user: FirebaseUser | null,
    additionalUserInfo?: AdditionalUserInfo | null,
}): Promise<void> {
    return new Promise(async resolve => {
        const unsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
            onData: async ({member}) => {
                if (member) {
                    try {
                        console.log("Got cactus member, can send login event", member);
                        unsubscriber();
                        let referredByEmail = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
                        if (!referredByEmail) {
                            try {
                                referredByEmail = window.localStorage.getItem(LocalStorageKey.referredByEmail);
                            } catch (e) {
                                console.error("error trying to get referredByEmail from local storage", e)
                            }
                        }
                        const landingParams = StorageService.getJSON(LocalStorageKey.landingQueryParams);

                        const event: LoginEvent = {
                            providerId: (args.additionalUserInfo && args.additionalUserInfo.providerId) || undefined,
                            userId: args.user && args.user.uid,
                            isNewUser: (args.additionalUserInfo && args.additionalUserInfo.isNewUser) || false,
                            referredByEmail: referredByEmail,
                            signupQueryParams: {...getAllQueryParams(), ...landingParams},
                            reflectionResponseIds: getAnonymousReflectionResponseIds(),
                        };
                        console.log("login-event payload", JSON.stringify(event, null, 2));
                        const headers = await getAuthHeaders();
                        await request.post(Endpoint.loginEvent, event, {headers});

                        /* Note: This may move to the backend later when we have time to 
                           implement the Facebook Ads API */
                        if (event.isNewUser && event.providerId) {
                            // new user who did not previous enter their email address
                            fireSignupEvent();
                        }
                        if (event.isNewUser) {
                            // all new users
                            fireConfirmedSignupEvent();
                        }
                    } catch (error) {
                        console.error("failed to send login event", error);
                    } finally {
                        resolve();
                    }
                } else {
                    console.log("No member found while observing for member...still waiting");
                }
            }
        });


        window.setTimeout(() => {
            unsubscriber && unsubscriber();
            resolve();
        }, 5000)


    });
}