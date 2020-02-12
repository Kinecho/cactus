import {Config} from "@web/config";

import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
// import Stripe = stripe.Stripe;
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import {Endpoint, getAuthHeaders, isAxiosError, request} from "@web/requestUtils";
import {gtag} from "@web/analytics";
import Logger from "@shared/Logger";
import CactusMember from "@shared/models/CactusMember";
import CactusMemberService from "@web/services/CactusMemberService";
import {PageRoute} from "@shared/PageRoutes";
import CopyService from "@shared/copy/CopyService";
import StripeCheckoutOptions = stripe.StripeClientCheckoutOptions;

const logger = new Logger("checkoutService.ts");
const stripe = Stripe(Config.stripe.apiKey);

export async function createStripeSession(options: { stripePlanId: string }): Promise<CreateSessionResponse> {
    const {stripePlanId} = options;

    if (!stripePlanId) {
        return {success: false, error: "You must provide a plan ID"};
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
        return {success: false, error: "You must be logged in to create a session", unauthorized: true};
    }

    const sessionRequest: CreateSessionRequest = {
        planId: stripePlanId,
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

/**
 * @Deprecated
 * @param {CreateSessionRequest} sessionRequest
 * @param {string | undefined} errorElementId
 * @return {Promise<any | null | undefined>}
 */
export async function redirectToCheckoutWithSessionId(sessionRequest: CreateSessionRequest, errorElementId: string | undefined = "stripe-error-message"): Promise<any | null | undefined> {
    const planId = sessionRequest.planId
    try {
        const authHeaders = await getAuthHeaders();
        const response = await request.post(Endpoint.checkoutSessions, sessionRequest, {headers: {...authHeaders}});
        const createResponse = response.data as CreateSessionResponse;
        if (createResponse.error) {
            logger.log("Unable to create stripe session", createResponse.error);
            return "Oops, something went wrong. Please try again later"
        }

        if (!createResponse.sessionId) {
            logger.log("Unable to create stripe session - no sessionId returned");
            return "Oops, something went wrong. Please try again later"
        }

        const stripeOptions = {
            sessionId: createResponse.sessionId
        };

        logger.log("stripe options:", stripeOptions);


        gtag('event', 'begin_checkout', {
            value: createResponse.amount,
            items: [createResponse.planId],
            currency: 'USD',
        });


        const result = await stripe.redirectToCheckout(stripeOptions);

        if (result.error) {
            // If `redirectToCheckout` fails due to a browser or network
            // error, display the localized error message to your customer.
            return result.error.message;

        } else {
            return;
        }
    } catch (error) {
        logger.log("error getting checkout session", error);
        if (isAxiosError(error)) {
            if (error.response?.status === 401) {
                logger.info("User is not authenticated, send them to the login flow");
                // sendToLoginForStripePlan(planId)
            }
        }

        return "Oops, something went wrong. Please try again later"
    }
}


export interface CheckoutRedirectResult {
    isRedirecting: boolean,
    isLoggedIn: boolean,
}

/**
 * Get a URL of the sign up page that will redirect the user to the checkout page upon successful sign in.
 * @param {string} stripePlanId
 * @return {string}
 */
export function getSignUpStripeCheckoutUrl(stripePlanId: string): string {
    const copy = CopyService.getSharedInstance().copy;
    const successUrl = `${PageRoute.CHECKOUT}?${QueryParam.SUBSCRIPTION_PLAN}=${stripePlanId}`;
    return `${PageRoute.SIGNUP}?${QueryParam.REDIRECT_URL}=${encodeURIComponent(successUrl)}&${QueryParam.MESSAGE}=${encodeURIComponent(copy.checkout.SIGN_IN_TO_CONTINUE_CHECKOUT)}`;
}

export function sendToLoginForStripePlan(stripePlanId: string) {
    window.location.href = getSignUpStripeCheckoutUrl(stripePlanId);
}

export async function startCheckout(options: {
    stripePlanId: string,
    member?: CactusMember | null | undefined,
    requireAuth?: boolean
}): Promise<CheckoutRedirectResult> {
    const {stripePlanId, requireAuth = true} = options;
    const member = options.member || await CactusMemberService.sharedInstance.getCurrentMember();
    const result: CheckoutRedirectResult = {
        isRedirecting: false,
        isLoggedIn: !!member,
    };

    if (!member && stripePlanId) {
        logger.info("User is not logged in, sending to sign in page with checkout redirect success url");
        sendToLoginForStripePlan(stripePlanId);
        result.isRedirecting = true;
    } else if (member && stripePlanId) {
        return await redirectToStripeCheckout({planId: stripePlanId, member});
    }

    return result;
}

export async function redirectToStripeCheckout(options: { planId: string, member: CactusMember }): Promise<CheckoutRedirectResult> {
    const {planId, member} = options;
    const sessionResponse = await createStripeSession({stripePlanId: planId});
    if (sessionResponse.unauthorized === true) {
        sendToLoginForStripePlan(planId);
        return {isLoggedIn: false, isRedirecting: true};
    }

    const sessionId = sessionResponse.sessionId;
    if (!sessionId) {
        logger.error("Unable to get the session id, return error", sessionResponse);
        return {isLoggedIn: true, isRedirecting: false}
    }

    const result = await stripe.redirectToCheckout({sessionId});

    if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer.
        logger.error("Failed to redirect to stripe checkout", result.error);
        return {isRedirecting: false, isLoggedIn: true};
    }

    return {isLoggedIn: true, isRedirecting: true};
}

/**
 * @deprecated - should use session based checkout
 *
 * @param {string} planId
 * @param {string | undefined | null} memberEmail
 * @return {Promise<void>}
 */
export async function redirectToCheckoutWithPlanId(planId: string = Config.stripe.monthlyPlanId,
                                                   memberEmail: string | undefined | null = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS)) {

    const stripeOptions: StripeCheckoutOptions = {
        items: [{
            plan: planId,
            quantity: 1
        }],
        successUrl: `${Config.domain}/success`,
        cancelUrl: `${Config.domain}`,
    };

    if (memberEmail) {
        stripeOptions.customerEmail = memberEmail;
    }

    logger.log("stripe options:", stripeOptions);


    gtag('event', 'begin_checkout', {
        items: [planId],
        currency: 'USD',
    });

    const result = await stripe.redirectToCheckout(stripeOptions);

    if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer.
        const displayError = document.getElementById('stripe-error-message');
        if (displayError) {
            displayError.textContent = result.error.message || "Unknown error";
        }
    }

}

/**
 *
 * @param {string} checkoutButtonId - the html ID of the button that was clicked
 * @param {string} planId
 */
export function configureStripe(checkoutButtonId: string, planId: string = Config.stripe.monthlyPlanId) {
    // noinspection JSUnresolvedFunction

    // @ts-ignore

    const checkoutButton = document.getElementById(checkoutButtonId);
    if (!checkoutButton) {
        return;
    }
    checkoutButton.addEventListener('click', async () => {
        // When the customer clicks on the button, redirect
        // them to Checkout.
        await redirectToCheckoutWithPlanId(planId)
    });
}

