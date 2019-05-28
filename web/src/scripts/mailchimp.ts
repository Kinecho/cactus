import "firebase/functions"
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {request} from "@web/requestUtils";
import SubscriptionResult from "@shared/mailchimp/models/SubscriptionResult";
/**
 *
 * @param {String} email
 * @param {String} [referredByEmail]
 *
 * @returns Promise
 */
export async function submitEmail(email: String, referredByEmail: String): Promise<SubscriptionResult>{
    let subscription = new SubscriptionRequest(email);
    subscription.referredByEmail = referredByEmail;
    // subscription.as
    console.log("submitting subscription", subscription);

    let result = (await request.post("/mailchimp", subscription)).data as SubscriptionResult;
    if (result.success){
        console.log("Signup successful", result)
    } else {
        console.warn("not successful getting data from endpoint", result)
    }
    return result
}