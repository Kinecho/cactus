import axios, {AxiosInstance} from "axios";
import {Config} from "@web/config";

let _request: AxiosInstance;

export enum Endpoint {
    mailchimp = "mailchimp",
    inbound = "inbound",
    checkout = "checkout",
    checkoutSessions = "checkout/sessions",
    signupEmailStatus = "signup/email-status",
}

export function initializeAxios(): AxiosInstance{
    const domain = Config.apiDomain;
    const baseURL = `${domain}`;
    axios.defaults.baseURL = baseURL;
    console.log("set axios base url to ", baseURL);


    _request = axios.create({
        baseURL: Config.apiDomain
    });

    return _request

}


function getInstance(){
    if (_request){
        return _request;
    }

    return initializeAxios();
}

export const request = getInstance();