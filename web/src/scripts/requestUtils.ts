import axios, {AxiosInstance} from "axios";
import {Config} from "@web/config";
import {getAuth} from "@web/firebase";

let _request: AxiosInstance;

export enum Endpoint {
    mailchimp = "mailchimp",
    inbound = "inbound",
    checkout = "checkout",
    checkoutSessions = "checkout/sessions",
    signupEmailStatus = "signup/email-status",
    sendMagicLink = "signup/magic-link",
    updateSubscriberStatus = "mailchimp/status",
    loginEvent = "signup/login-event",
}

export function initializeAxios(): AxiosInstance {
    const domain = Config.apiDomain;
    const baseURL = `${domain}`;
    axios.defaults.baseURL = baseURL;

    _request = axios.create({
        baseURL: Config.apiDomain
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