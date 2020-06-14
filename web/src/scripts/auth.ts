import SignupRequest from "@shared/mailchimp/models/SignupRequest";
import { getAllQueryParams, getQueryParam } from "@web/util";
import { AdditionalUserInfo, FirebaseUser, FirebaseUserCredential, getAuth, initializeFirebase, } from "@web/firebase";
import { PageRoute } from "@shared/PageRoutes";
import { Endpoint, getAuthHeaders, request } from "@web/requestUtils";
import {
    EmailStatusRequest,
    EmailStatusResponse,
    LoginEvent,
    MagicLinkRequest,
    MagicLinkResponse,
    SourceApp
} from "@shared/api/SignupEndpointTypes";
import { QueryParam } from "@shared/util/queryParams";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import CactusMemberService from "@web/services/CactusMemberService";
import { fireConfirmedSignupEvent, fireLoginEvent, fireSignupLeadEvent } from "@web/analytics";
import Logger from "@shared/Logger";
import { getAppType, isAndroidApp } from "@web/DeviceUtil";
import { pushRoute } from "@web/NavigationUtil";

const logger = new Logger("auth.ts");
const firebase = initializeFirebase();

export interface LogoutOptions {
    redirectOnSignOut: boolean,
    redirectUrl?: string
}

export const DefaultLogoutOptions = { redirectOnSignOut: true, redirectUrl: "/" };

export async function logout(options: LogoutOptions = DefaultLogoutOptions) {
    try {
        await getAuth().signOut();
        StorageService.clear();
        const url = options.redirectUrl ?? DefaultLogoutOptions.redirectUrl;
        await pushRoute(url);
    } catch (error) {
        logger.error("Exception thrown while logging out", error);
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

export async function getEmailStatus(email: string): Promise<EmailStatusResponse> {
    try {
        const statusRequest: EmailStatusRequest = { email };
        const emailResponse = await request.post(Endpoint.signupEmailStatus, statusRequest);
        return emailResponse.data;
    } catch (e) {
        logger.error("Failed to get the email status before sending magic link", e);
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
        logger.error("Failed to get a success response from magic link endpoint", e);
        return {
            success: false,
            exists: false,
            email: options.email,
            message: "Failed to send magic link",
            error: e,
        }
    }
}

export async function sendEmailLinkSignIn(subscription: SignupRequest): Promise<EmailLinkSignupResult> {
    const email = subscription.email;
    const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
    let emailLinkRedirectUrl: string = PageRoute.SIGNUP_CONFIRMED;
    if (redirectUrlParam) {
        emailLinkRedirectUrl = `${ emailLinkRedirectUrl }?${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(redirectUrlParam) }`
    }

    const landingParams = StorageService.getJSON(LocalStorageKey.landingQueryParams);
    const sourceApp = isAndroidApp() ? SourceApp.android : SourceApp.web;

    logger.log("Setting redirect url for email link signup to be ", emailLinkRedirectUrl);

    const statusResponse = await sendMagicLink({
        email: email,
        referredBy: subscription.referredByEmail,
        continuePath: emailLinkRedirectUrl,
        queryParams: landingParams,
        sourceApp: sourceApp
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
            onData: async ({ member }) => {
                if (member) {
                    try {
                        logger.log("[auth.sendLoginEvent] member subscription created at typeof = ", typeof (member?.subscription?.trial?.startedAt));
                        logger.log("Got cactus member, can send login event", member);
                        unsubscriber();
                        let referredByEmail = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
                        if (!referredByEmail) {
                            try {
                                referredByEmail = window.localStorage.getItem(LocalStorageKey.referredByEmail);
                            } catch (e) {
                                logger.error("error trying to get referredByEmail from local storage", e)
                            }
                        }
                        const landingParams = StorageService.getJSON(LocalStorageKey.landingQueryParams);

                        const event: LoginEvent = {
                            providerId: (args.additionalUserInfo && args.additionalUserInfo.providerId) || undefined,
                            userId: args.user && args.user.uid,
                            isNewUser: (args.additionalUserInfo && args.additionalUserInfo.isNewUser) || false,
                            referredByEmail: referredByEmail,
                            signupQueryParams: { ...getAllQueryParams(), ...landingParams },
                            app: getAppType(),
                        };
                        logger.log("login-event payload", JSON.stringify(event, null, 2));
                        const headers = await getAuthHeaders();
                        await request.post(Endpoint.loginEvent, event, { headers });

                        /* Note: This may move to the backend later when we have time to 
                           implement the Facebook Ads API */
                        if (event.isNewUser && isThirdPartySignIn(event.providerId)) {
                            // new user who did not previous enter their email address
                            await fireSignupLeadEvent();
                        }
                        if (event.isNewUser) {
                            // all new users
                            logger.info("New user just signed up, firing analytics event");
                            await fireConfirmedSignupEvent({
                                email: args.user?.email || undefined,
                                userId: args.user?.uid,
                                method: event.providerId,
                            });
                        } else {
                            fireLoginEvent({ method: event.providerId });
                        }
                    } catch (error) {
                        logger.error("failed to send login event", error);
                    } finally {
                        resolve();
                    }
                } else {
                    logger.log("No member found while observing for member...still waiting");
                }
            }
        });


        window.setTimeout(() => {
            unsubscriber && unsubscriber();
            resolve();
        }, 5000)


    });
}

export function isThirdPartySignIn(provider: string | undefined): boolean {
    switch (provider) {
        case "password":
            return false;
        default:
            return true;
    }
}