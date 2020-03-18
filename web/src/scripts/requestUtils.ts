import axios, {AxiosError, AxiosInstance} from "axios";
import {Config} from "@web/config";
import {getAuth} from "@web/firebase";
import {deserializeJson} from "@shared/util/ApiUtil";

let _request: AxiosInstance;

export enum Endpoint {
    mailchimp = "mailchimp",
    inbound = "inbound",
    checkout = "checkout",
    checkoutSessions = "checkout/sessions/create-subscription",
    signupEmailStatus = "signup/email-status",
    sendMagicLink = "signup/magic-link",
    updateSubscriberStatus = "mailchimp/status",
    unsubscribeConfirm = "mailchimp/unsubscribe/confirm",
    loginEvent = "signup/login-event",
    sendInvite = "social/send-invite",
    notifyFriendRequest = "social/notify-friend-request",
    activityFeed = "social/activity-feed",
    activityFeedSummary = "social/activity-feed-summary",
    userDeletePermanently = "user/delete-permanently",
    subscriptionDetails = "checkout/subscription-details",
    subscriptionSetup = "checkout/sessions/setup-subscription",
    androidFulfilPurchase = "checkout/android/fulfill-purchase",
}

export function initializeAxios(): AxiosInstance {
    const domain = Config.apiDomain;
    const baseURL = `${domain}`;
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 30000; //30 second timeout
    _request = axios.create({
        baseURL: Config.apiDomain,
        transformResponse: [(data: string) => {
            return deserializeJson(data)
        }]
    });

    return _request
}


export async function getAuthHeaders(): Promise<{ Authorization: string } | undefined> {
    const user = getAuth().currentUser;
    if (user) {
        const token = await user.getIdToken();

        return {Authorization: `Bearer ${token}`};
    }
    return undefined;
}

function getInstance() {
    if (_request) {
        return _request;
    }

    return initializeAxios();
}

export const request = getInstance();

export function isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError
}