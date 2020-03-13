import {Config} from "@web/config";
import {QueryParam} from "@shared/util/queryParams";
import {
    CreateSessionRequest,
    CreateSessionResponse,
    CreateSetupSubscriptionSessionRequest,
    CreateSetupSubscriptionSessionResponse
} from "@shared/api/CheckoutTypes";
import {Endpoint, getAuthHeaders, isAxiosError, request} from "@web/requestUtils";
import {gtag} from "@web/analytics";
import Logger from "@shared/Logger";
import CactusMember from "@shared/models/CactusMember";
import CactusMemberService from "@web/services/CactusMemberService";
import {PageRoute} from "@shared/PageRoutes";
import CopyService from "@shared/copy/CopyService";
import {SubscriptionDetails} from "@shared/models/SubscriptionTypes";
import {stripQueryParams} from "@shared/util/StringUtil";
import {isAndroidApp} from "@web/DeviceUtil";

const logger = new Logger("checkoutService.ts");
const stripe = Stripe(Config.stripe.apiKey);


interface AndroidDelegate {
    onCompleted: (success: boolean) => void
}

let androidDelegate: AndroidDelegate | undefined = undefined;


export async function createStripeSession(options: { subscriptionProductId: string }): Promise<CreateSessionResponse> {
    const {subscriptionProductId} = options;

    if (!subscriptionProductId) {
        return {success: false, error: "You must provide a subscriptionProductId"};
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
        return {success: false, error: "You must be logged in to create a session", unauthorized: true};
    }

    const cancelUrl = `${stripQueryParams(window.location.href).url}`;

    const sessionRequest: CreateSessionRequest = {
        cancelUrl,
        subscriptionProductId,
    };
    try {
        const response = await request.post(Endpoint.checkoutSessions, sessionRequest, {headers: {...authHeaders}});
        logger.info("Session response successfully returned", response);
        return response.data;
    } catch (error) {
        const result: CreateSessionResponse = {success: false};
        if (isAxiosError(error)) {
            if (error.response?.status === 401) {
                result.error = "You must be logged in to create a session";
                result.unauthorized = true;
            } else {
                result.error = JSON.stringify(error.response?.data ?? error.response?.status ?? "unknown error");
            }
        } else {
            result.error = error.message ?? "unknown error";
        }
        return result;
    }

}

export interface CheckoutRedirectResult {
    isRedirecting: boolean,
    isLoggedIn: boolean,
    success: boolean
}

/**
 * Get a URL of the sign up page that will redirect the user to the checkout page upon successful sign in.
 * @param {string} options.subscriptionProductId
 * @return {string}
 */
export function getSignUpStripeCheckoutUrl(options: { subscriptionProductId: string }): string {
    const {subscriptionProductId} = options;
    const copy = CopyService.getSharedInstance().copy;
    const successUrl = `${PageRoute.CHECKOUT}?${QueryParam.SUBSCRIPTION_PRODUCT_ID}=${subscriptionProductId}`;
    return `${PageRoute.SIGNUP}?${QueryParam.REDIRECT_URL}=${encodeURIComponent(successUrl)}&${QueryParam.MESSAGE}=${encodeURIComponent(copy.checkout.SIGN_IN_TO_CONTINUE_CHECKOUT)}`;
}

export function sendToLoginForCheckout(options: { subscriptionProductId: string }) {
    logger.warn("Sending to login before checkout can occur");
    window.location.href = getSignUpStripeCheckoutUrl(options);
}

/**
 * Start the checkout process. This flow may change depending on the device a user is on.
 * @param {{subscriptionProductId: string, member?: CactusMember | null | undefined, requireAuth?: boolean}} options
 * @return {Promise<CheckoutRedirectResult>}
 */
export async function startCheckout(options: {
    subscriptionProductId: string,
    member?: CactusMember | null | undefined,
}): Promise<CheckoutRedirectResult> {
    const {subscriptionProductId} = options;
    const member = options.member || await CactusMemberService.sharedInstance.getCurrentMember();
    const result: CheckoutRedirectResult = {
        isRedirecting: false,
        isLoggedIn: !!member,
        success: true,
    };

    if (!member && subscriptionProductId) {
        logger.warn("User is not logged in, sending to sign in page with checkout redirect success url");
        sendToLoginForCheckout({subscriptionProductId});
        result.isRedirecting = true;
    } else if (member && subscriptionProductId) {
        if (isAndroidApp()) {
            return await startAndroidCheckout({subscriptionProductId, member});
        }
        return await redirectToStripeCheckout({subscriptionProductId, member});
    }

    return result;
}

export async function startAndroidCheckout(options: { subscriptionProductId: string, member: CactusMember }): Promise<CheckoutRedirectResult> {
    const {member, subscriptionProductId} = options;
    const memberId = member.id;
    if (!memberId) {
        return {isRedirecting: false, isLoggedIn: false, success: false}
    }
    if (!window.Android) {
        logger.error("Failed to get android app interface object");
        return {isRedirecting: false, isLoggedIn: false, success: false}
    }
    alert("Test alerts");
    return new Promise<CheckoutRedirectResult>(resolve => {
        window.Android?.startCheckout(subscriptionProductId, memberId);
        androidDelegate = {
            onCompleted: (success: boolean) => {
                window.Android?.showToast("Checkout completed- from web");
                resolve({success, isRedirecting: false, isLoggedIn: true});
            }
        }
    })
}

window.androidCheckoutFinished = (success) => {
    logger.info("Android checkout finished with success = ", success);
    alert("Checkout finished from android: " + success);
    androidDelegate?.onCompleted(success)
};

/**
 * Send a user to the Stripe checkout page using a subscription product id.
 * This method will call our server to create a stripe checkout session which will be used in the redirect
 *
 * @param {{subscriptionProductId: string, member: CactusMember}} options
 * @return {Promise<CheckoutRedirectResult>}
 */
export async function redirectToStripeCheckout(options: { subscriptionProductId: string, member: CactusMember }): Promise<CheckoutRedirectResult> {
    const {subscriptionProductId, member} = options;
    await CactusMemberService.sharedInstance.getCurrentMember(); //just to ensure we don't prematurely redirect away - this waits for the auth to load at least once
    const sessionResponse = await createStripeSession({subscriptionProductId});
    if (sessionResponse.unauthorized === true) {
        logger.warn("User is not logged in while attempting ot create stripe session. Can not check out - sending back to sign in page");
        sendToLoginForCheckout({subscriptionProductId});
        return {isLoggedIn: false, isRedirecting: true, success: true};
    }

    const sessionId = sessionResponse.sessionId;
    if (!sessionId) {
        logger.error("Unable to get the session id, return error", sessionResponse);
        return {isLoggedIn: true, isRedirecting: false, success: false}
    }

    gtag('event', 'begin_checkout', {
        value: sessionResponse.amount,
        items: [subscriptionProductId],
        currency: 'USD',
    });

    const result = await stripe.redirectToCheckout({sessionId});

    if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer.
        logger.error("Failed to redirect to stripe checkout", result.error);
        return {isRedirecting: false, isLoggedIn: true, success: true};
    }

    return {isLoggedIn: true, isRedirecting: true, success: true};
}

export async function startStripeCheckoutSession(sessionId: string): Promise<{ error?: any }> {
    const response = await stripe.redirectToCheckout({sessionId});
    if (response.error) {
        logger.error("Failed to send to checkout", response.error);
    }
    return response;
}

export async function getSubscriptionDetails(): Promise<SubscriptionDetails | undefined> {
    try {
        if (!CactusMemberService.sharedInstance.currentMember?.hasActiveSubscription) {
            return;
        }
        return (await request.get(Endpoint.subscriptionDetails, {headers: {...await getAuthHeaders()}})).data;
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error(`failed to fetch subscription details: ${error.response?.status}`, error.response?.data);
        } else {
            logger.error("Failed to fetch subscription details. ", error)
        }
        return;
    }
}

export async function getUpdatePaymentMethodSession(data: CreateSetupSubscriptionSessionRequest): Promise<CreateSetupSubscriptionSessionResponse> {
    try {
        const response = await request.post(Endpoint.subscriptionSetup, data, {headers: {...await getAuthHeaders()}});
        logger.info("Fetched update payment method session response", response.data);
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error("Failed to get session", error.response?.data);
        } else {
            logger.error("Failed to get session", error);
        }
        return {error: "Unable to fetch session", success: false};
    }
}