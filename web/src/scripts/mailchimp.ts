import * as firebase from "firebase/app"
import "firebase/functions"
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";

/**
 *
 * @param {String} email
 * @param {String} [referredByEmail]
 *
 * @returns Promise
 */
export function submitEmail(email: String, referredByEmail: String){
    let signup = firebase.functions().httpsCallable("mailchimp");

    let subscription = new SubscriptionRequest(email);
    subscription.referredByEmail = referredByEmail;
    // subscription.as
    console.log("submitting subscription", subscription);
    return signup(subscription).then(result => {
        if (result.data.success){
            console.log("success!!", result)
        } else {
            console.warn("not successful getting data from endpoint", result)
        }
        return result
    }).catch( error => {
        console.error("failed to signup", error);
        return error
    })
}