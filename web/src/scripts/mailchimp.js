import * as firebase from "firebase/app"
import "firebase/functions"

/**
 *
 * @param {object} options
 * @param {string} options.email
 * @param {string} [options.referrerEmail]
 *
 * @returns Promise
 */
export function submitEmail({email, referrerEmail}){
    let signup = firebase.functions().httpsCallable("mailchimp", {

    })

    let data = {email, referrerEmail};
    let context = {}
    return signup(data, context).then(result => {
        if (result.data.success){
            console.log("success!!", result)
        } else {
            console.warn("not successful getting data from endpoint", result)
        }
        return result
    }).catch( error => {
        console.error("failed to signup", error)
        return error
    })
}