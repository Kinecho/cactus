import { Config } from "@web/config";
import { QueryParam } from "@shared/util/queryParams";
import {
    AndroidFulfillParams,
    AndroidFulfillRestoredPurchasesParams,
    AndroidFulfillRestorePurchasesResult,
    AndroidFulfillResult,
    AndroidPurchaseResult,
    AndroidRestorePurchaseResult,
    CancelStripeSubscriptionResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    CreateSetupSubscriptionSessionRequest,
    CreateSetupSubscriptionSessionResponse
} from "@shared/api/CheckoutTypes";
import { Endpoint, getAuthHeaders, isAxiosError, request } from "@web/requestUtils";
import { logBeginCheckout } from "@web/analytics";
import Logger from "@shared/Logger";
import CactusMember from "@shared/models/CactusMember";
import CactusMemberService from "@web/services/CactusMemberService";
import { PageRoute } from "@shared/PageRoutes";
import CopyService from "@shared/copy/CopyService";
import { SubscriptionDetails } from "@shared/models/SubscriptionTypes";
import { appendDomain, appendQueryParams, isBlank, stripQueryParams } from "@shared/util/StringUtil";
import { isAndroidApp } from "@web/DeviceUtil";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import AndroidService from "@web/android/AndroidService";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import { AxiosResponse } from "axios";
import { pushRoute } from "@web/NavigationUtil";


const logger = new Logger("checkoutService.ts");
const stripe = Stripe(Config.stripe.apiKey);

export async function createStripeSession(options: { subscriptionProductId: string, successUrl?: string, cancelUrl?: string }): Promise<CreateSessionResponse> {
    const defaultCancelUrl = `${ stripQueryParams(window.location.href).url }`;
    const { subscriptionProductId, cancelUrl = defaultCancelUrl, successUrl } = options;

    if (!subscriptionProductId) {
        return { success: false, error: "You must provide a subscriptionProductId" };
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
        return { success: false, error: "You must be logged in to create a session", unauthorized: true };
    }


    const sessionRequest: CreateSessionRequest = {
        subscriptionProductId,
        successUrl: !isBlank(successUrl) ? appendDomain(successUrl, Config.domain) : undefined,
        cancelUrl: !isBlank(cancelUrl) ? appendDomain(cancelUrl, Config.domain) : undefined,
    };
    try {
        const response: AxiosResponse<CreateSessionResponse> = await request.post(Endpoint.checkoutSessions, sessionRequest, { headers: { ...authHeaders } });
        logger.info("Session response successfully returned", response);
        return response.data;
    } catch (error) {
        const result: CreateSessionResponse = { success: false };
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
    canceled?: boolean,
    isLoggedIn: boolean,
    success: boolean
}

/**
 * Get a URL of the sign up page that will redirect the user to the checkout page upon successful sign in.
 * @param {string} options.subscriptionProductId
 * @return {string}
 */
export function getSignUpStripeCheckoutPath(options: { subscriptionProductId: string, checkoutSuccessUrl?: string, checkoutCancelUrl?: string|null }): string {
    const { subscriptionProductId, checkoutSuccessUrl, checkoutCancelUrl } = options;
    const copy = CopyService.getSharedInstance().copy;
    // const loginRedirectUrl = `${ PageRoute.CHECKOUT }?${ QueryParam.SUBSCRIPTION_PRODUCT_ID }=${ subscriptionProductId }`;

    const loginRedirectUrl = appendQueryParams(PageRoute.CHECKOUT, {
        [QueryParam.SUBSCRIPTION_PRODUCT_ID]: subscriptionProductId,
        [QueryParam.CHECKOUT_SUCCESS_URL]: checkoutSuccessUrl,
        [QueryParam.CHECKOUT_CANCEL_URL]: checkoutCancelUrl,
    })

    const signInUrl = appendQueryParams(PageRoute.SIGNUP, {
        [QueryParam.REDIRECT_URL]: loginRedirectUrl,
        [QueryParam.MESSAGE]: copy.checkout.SIGN_IN_TO_CONTINUE_CHECKOUT,
    })

    logger.info("Sending to sign in with URL ", signInUrl);
    // return `${ PageRoute.SIGNUP }?${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(loginRedirectUrl) }&${ QueryParam.MESSAGE }=${ encodeURIComponent(copy.checkout.SIGN_IN_TO_CONTINUE_CHECKOUT) }`;
    return signInUrl;
}

export function getSignUpAndroidCheckoutUrl(): string {
    const copy = CopyService.getSharedInstance().copy;
    const successUrl = `${ PageRoute.PRICING }?${ QueryParam.PREMIUM_DEFAULT }=true&${ QueryParam.FROM_AUTH }=true#upgrade`;
    return `${ PageRoute.SIGNUP }?${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(successUrl) }&${ QueryParam.MESSAGE }=${ encodeURIComponent(copy.checkout.SIGN_IN_TO_CONTINUE_CHECKOUT) }`;
}

export function getSignUpAndroidRestoreUrl(): string {
    const copy = CopyService.getSharedInstance().copy;
    const successUrl = `${ PageRoute.PRICING }?${ QueryParam.PREMIUM_DEFAULT }=true&${ QueryParam.FROM_AUTH }=true#upgrade`;
    return `${ PageRoute.SIGNUP }?${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(successUrl) }&${ QueryParam.MESSAGE }=${ encodeURIComponent(copy.checkout.SIGN_IN_TO_CONTINUE_RESTORING_PURCHASES) }`;
}

/**
 * The success and cancel URLs are the params that are passed into Stripe
 * for handling the checkout completion redirects
 * @param {{
 * subscriptionProductId: string,
 * checkoutSuccessUrl?: string,
 * checkoutCancelUrl?: string
 * }} options
 */
export async function sendToLoginForCheckout(options: { subscriptionProductId: string, checkoutSuccessUrl?: string, checkoutCancelUrl?: string|null }) {
    logger.warn("Sending to login before checkout can occur");
    if (isAndroidApp()) {
        window.location.href = getSignUpAndroidCheckoutUrl();
    } else {
        // window.location.href = getSignUpStripeCheckoutPath(options);
        await pushRoute(getSignUpStripeCheckoutPath(options))
        return;
    }

}

/**
 * Start the checkout process. This flow may change depending on the device a user is on.
 * @param {{
 *  subscriptionProductId: string,
 *  member?: CactusMember | null | undefined,
 *  requireAuth?: boolean,
 *  stripeSuccessUrl?: string,
 *  stripeCancelUrl?: string
 *  }} options
 * @return {Promise<CheckoutRedirectResult>}
 */
export async function startCheckout(options: {
    subscriptionProductId: string,
    subscriptionProduct?: SubscriptionProduct
    member?: CactusMember | null | undefined,
    stripeSuccessUrl?: string,
    stripeCancelUrl?: string|null
}): Promise<CheckoutRedirectResult> {
    const {
        subscriptionProductId,
        subscriptionProduct,
        stripeCancelUrl,
        stripeSuccessUrl
    } = options;
    const member = options.member || await CactusMemberService.sharedInstance.getCurrentMember();
    const result: CheckoutRedirectResult = {
        isRedirecting: false,
        isLoggedIn: !!member,
        success: true,
    };

    if (subscriptionProduct) {
        StorageService.saveNumber(LocalStorageKey.subscriptionPriceCents, subscriptionProduct.priceCentsUsd);
    }

    if (!member && subscriptionProductId) {
        logger.warn("User is not logged in, sending to sign in page with checkout redirect success url");
        await sendToLoginForCheckout({
            subscriptionProductId,
            checkoutSuccessUrl: stripeSuccessUrl,
            checkoutCancelUrl: stripeCancelUrl
        });
        result.isRedirecting = true;
    } else if (member && subscriptionProductId) {
        if (isAndroidApp()) {
            return await startAndroidCheckout({ subscriptionProductId, member, subscriptionProduct });
        }
        return await redirectToStripeCheckout({
            subscriptionProductId,
            member,
            successUrl: stripeSuccessUrl,
            cancelUrl: stripeCancelUrl,
        });
    }

    return result;
}

export async function startAndroidCheckout(options: { subscriptionProductId: string, member: CactusMember, subscriptionProduct?: SubscriptionProduct, }): Promise<CheckoutRedirectResult> {
    logger.info("starting android checkout with", options);
    const { member, subscriptionProduct } = options;
    const androidProductId = subscriptionProduct?.androidProductId;
    const memberId = member.id;
    if (!memberId) {
        logger.warn("No member id was found, returning error");
        return { isRedirecting: false, isLoggedIn: false, success: false }
    }

    if (!androidProductId) {
        logger.warn("no android product ID was found, returning failure")
        return { isRedirecting: false, isLoggedIn: true, success: false }
    }

    if (!AndroidService.shared.isReady) {
        logger.error("Failed to get android app interface object");
        return { isRedirecting: false, isLoggedIn: false, success: false }
    }
    const delegateHandler = createAndroidCheckoutDelegateHandler();
    logger.info("starting android checkout");
    AndroidService.shared.startCheckout(androidProductId, memberId);
    return delegateHandler;
}

function createAndroidCheckoutDelegateHandler(): Promise<CheckoutRedirectResult> {
    return new Promise<CheckoutRedirectResult>(resolve => {
        AndroidService.shared.checkoutDelegate = {
            handleRestoreCompleted: async (restoreResult: AndroidRestorePurchaseResult) => {
                if (!restoreResult.success) {
                    logger.error("Restore checkout returned unsuccessful response ");
                    resolve({ success: false, isRedirecting: false, isLoggedIn: true });
                    AndroidService.shared.showToast("Unable to restore purchases");
                    return;
                }

                if (!restoreResult.records || restoreResult.records.length === 0) {
                    AndroidService.shared.showToast("There were no purchases to restore");
                    const result = { success: true, isRedirecting: false, isLoggedIn: true };
                    resolve(result);
                    return;
                }

                const fulfillResult = await fulfillAndroidRestoredPurchases({ restoredPurchases: restoreResult.records });
                logger.info("restored result", fulfillResult);
                if (fulfillResult.success) {
                    fulfillResult.fulfillResults?.forEach(p => {
                        const token = p.historyRecord?.token ?? p.purchase?.token;
                        if (token) {
                            const memberId = CactusMemberService.sharedInstance.currentMember?.id;
                            AndroidService.shared.handlePurchaseFulfilled({
                                purchaseToken: token,
                                developerPayload: stringifyJSON({ memberId })
                            })
                        }

                    });

                    const result = { success: true, isRedirecting: false, isLoggedIn: true };
                    resolve(result);
                    return;
                }
                resolve({ success: false, isRedirecting: false, isLoggedIn: true });
                return;
            },
            handlePurchaseCompleted: async (androidPurchaseResult: AndroidPurchaseResult) => {
                logger.info("Android delegate onCompleted called with ", androidPurchaseResult);
                if (androidPurchaseResult.success && androidPurchaseResult.purchase) {
                    logger.info("Attempting to fulfill android purchase");
                    const fulfillResult = await fulfilAndroidPurchase({ purchase: androidPurchaseResult.purchase });
                    logger.info("fulfillment result", fulfillResult);

                    if (fulfillResult.success) {
                        const memberId = CactusMemberService.sharedInstance.currentMember?.id;
                        AndroidService.shared.handlePurchaseFulfilled({
                            purchaseToken: fulfillResult.purchase?.token ?? androidPurchaseResult.purchase.token,
                            developerPayload: stringifyJSON({ memberId })
                        })
                    }

                    const result = { success: fulfillResult.success, isRedirecting: false, isLoggedIn: true };
                    resolve(result);
                } else if (androidPurchaseResult.canceled) {
                    logger.info("The user canceled the checkout flow");
                    resolve({ success: false, canceled: true, isRedirecting: false, isLoggedIn: true });
                } else {
                    logger.info("not attempting to fulfill purchase, result was not a success or no purchase was found on the response");
                    const result = { success: false, canceled: false, isRedirecting: false, isLoggedIn: true };
                    resolve(result);
                }
            }
        }
    })
}

/**
 * Send a user to the Stripe checkout page using a subscription product id.
 * This method will call our server to create a stripe checkout session which will be used in the redirect
 *
 * @param {{
 *  subscriptionProductId: string,
 *  member: CactusMember,
 *  successUrl: string,
 *  cancelUrl: string}} options
 * @return {Promise<CheckoutRedirectResult>}
 */
export async function redirectToStripeCheckout(options: { subscriptionProductId: string, member: CactusMember, successUrl?: string, cancelUrl?: string|null }): Promise<CheckoutRedirectResult> {
    const { subscriptionProductId, member, successUrl, cancelUrl } = options;
    await CactusMemberService.sharedInstance.getCurrentMember(); //just to ensure we don't prematurely redirect away - this waits for the auth to load at least once
    const sessionResponse = await createStripeSession({
        subscriptionProductId,
        successUrl: isBlank(successUrl) ? undefined : successUrl,
        cancelUrl: isBlank(cancelUrl) ? undefined : cancelUrl,
    });

    if (sessionResponse.unauthorized === true) {
        logger.warn("User is not logged in while attempting ot create stripe session. Can not check out - sending back to sign in page");
        await sendToLoginForCheckout({
            subscriptionProductId,
            checkoutSuccessUrl: isBlank(successUrl) ? undefined : successUrl,
            checkoutCancelUrl: isBlank(cancelUrl) ? undefined : cancelUrl,
        });
        return { isLoggedIn: false, isRedirecting: true, success: true };
    }

    const sessionId = sessionResponse.sessionId;
    if (!sessionId) {
        logger.error("Unable to get the session id, return error", sessionResponse);
        return { isLoggedIn: true, isRedirecting: false, success: false }
    }

    logBeginCheckout({
        valueDollars: (sessionResponse.amount ?? 0) / 100,
        subscriptionProductId: subscriptionProductId
    })

    const result = await stripe.redirectToCheckout({ sessionId });

    if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer.
        logger.error("Failed to redirect to stripe checkout", result.error);
        return { isRedirecting: false, isLoggedIn: true, success: true };
    }

    return { isLoggedIn: true, isRedirecting: true, canceled: false, success: true };
}

export async function restoreAndroidPurchases(options: { member: CactusMember | undefined }): Promise<CheckoutRedirectResult> {
    const member = options.member || await CactusMemberService.sharedInstance.getCurrentMember();

    if (!isAndroidApp()) {
        logger.error("Attempted to restore purchases but user is not in the android app.");
        return { success: false, canceled: true, isLoggedIn: !!member, isRedirecting: false }
    }


    if (!member) {
        window.location.href = getSignUpAndroidRestoreUrl();
        return {
            canceled: false,
            isRedirecting: true,
            isLoggedIn: false,
            success: true,
        };
    } else {
        const delegateHandler = createAndroidCheckoutDelegateHandler();
        AndroidService.shared.restorePurchases();
        return delegateHandler;
    }

}

async function fulfillAndroidRestoredPurchases(params: AndroidFulfillRestoredPurchasesParams): Promise<AndroidFulfillRestorePurchasesResult> {
    try {
        logger.info("Attempting to fulfill restored android purchase", params);
        const response: AxiosResponse<AndroidFulfillRestorePurchasesResult> = await request.post(Endpoint.androidFulfilRestoredPurchases, params, { headers: { ...await getAuthHeaders() } });
        logger.info("Send fulfil request successfully. Response = ", response.data);
        return response.data;
    } catch (error) {
        let e = error;
        if (isAxiosError(error)) {
            e = error.response?.data ?? e
        }
        logger.error("Failed to process the anrdroid restore purchases result", stringifyJSON(e));
        return { success: false, message: "Unable to complete the purchase." }
    }
}

async function fulfilAndroidPurchase(params: AndroidFulfillParams): Promise<AndroidFulfillResult> {
    try {
        logger.info("Attempting to fulfill android purchase", params);
        const response: AxiosResponse<AndroidFulfillResult> = await request.post(Endpoint.androidFulfilPurchase, params, { headers: { ...await getAuthHeaders() } });
        logger.info("Send fulfil request successfully. Response = ", response.data);
        return response.data;
    } catch (error) {
        let e = error;
        if (isAxiosError(error)) {
            e = error.response?.data ?? e
        }
        logger.error("Failed to process result", stringifyJSON(e));
        return { success: false, purchase: params.purchase, message: "Unable to complete the purchase." }
    }
}

export async function startStripeCheckoutSession(sessionId: string): Promise<{ error?: any }> {
    const response = await stripe.redirectToCheckout({ sessionId });
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
        return (await request.get(Endpoint.subscriptionDetails, { headers: { ...await getAuthHeaders() } })).data as SubscriptionDetails;
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error(`failed to fetch subscription details: ${ error.response?.status }`, error.response?.data);
        } else {
            logger.error("Failed to fetch subscription details. ", error)
        }
        return;
    }
}

export async function getUpdatePaymentMethodSession(data: CreateSetupSubscriptionSessionRequest): Promise<CreateSetupSubscriptionSessionResponse> {
    try {
        const response: AxiosResponse<CreateSetupSubscriptionSessionResponse> = await request.post(Endpoint.subscriptionSetup, data, { headers: { ...await getAuthHeaders() } });
        logger.info("Fetched update payment method session response", response.data);
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error("Failed to get session", error.response?.data);
        } else {
            logger.error("Failed to get session", error);
        }
        return { error: "Unable to fetch session", success: false };
    }
}

export async function cancelStripeSubscription(): Promise<CancelStripeSubscriptionResponse> {
    try {
        const response: AxiosResponse<CancelStripeSubscriptionResponse> = await request.post(Endpoint.cancelStripeSubscription, {}, { headers: { ...await getAuthHeaders() } });
        logger.info("Cancellation response: ", response);
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error("Failed to cancel subscription", error.response?.data);
            return error.response?.data
        } else {
            logger.error("Failed to cancel subscription", error);
            return { success: false, error: error.message ?? "An unexpected error occurred" }
        }
    }
}