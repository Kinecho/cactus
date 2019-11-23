import {Config} from "@web/config";

import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
// import Stripe = stripe.Stripe;
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import {Endpoint, request} from "@web/requestUtils";
import {gtag} from "@web/analytics";
import StripeCheckoutOptions = stripe.StripeClientCheckoutOptions;

export async function redirectToCheckoutWithSessionId(sessionRequest:CreateSessionRequest, errorElementId:string|undefined="stripe-error-message"):Promise<any|null|undefined> {
    const stripe = Stripe(Config.stripe.apiKey);

    try {
        const response = await request.post(Endpoint.checkoutSessions, sessionRequest);
        const createResponse = response.data as CreateSessionResponse;
        if (createResponse.error){
            console.log("Unable to create stripe session", createResponse.error);
            return "Oops, something went wrong. Please try again later"
        }

        if (!createResponse.sessionId){
            console.log("Unable to create stripe session - no sessionId returned");
            return "Oops, something went wrong. Please try again later"
        }

        const stripeOptions = {
            sessionId: createResponse.sessionId
        };

        console.log("stripe options:", stripeOptions);


        gtag('event', 'begin_checkout', {
            value: createResponse.amount,
            items: [createResponse.productId],
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
    } catch(error) {
        console.log("error getting checkout session", error);
        return "Oops, something went wrong. Please try again later"
    }
}



export async function redirectToCheckoutWithPlanId(planId:string=Config.stripe.monthlyPlanId, 
                                                   memberEmail:string|undefined|null=getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS)) {
    const stripe = Stripe(Config.stripe.apiKey);

    const stripeOptions:StripeCheckoutOptions = {
        items: [
            {
                plan: planId, quantity: 1
            }
        ],

        // Do not rely on the redirect to the successUrl for fulfilling
        // purchases, customers may not always reach the success_url after
        // a successful payment.
        // Instead use one of the strategies described in
        // https://stripe.com/docs/payments/checkout/fulfillment
        successUrl: `${Config.domain}/success`,
        cancelUrl: `${Config.domain}`,
    };

    if (memberEmail){
        stripeOptions.customerEmail = memberEmail;
    }

    console.log("stripe options:", stripeOptions);


    gtag('event', 'begin_checkout', {
        items: [planId],
        currency: 'USD',
    });

    const result = await stripe.redirectToCheckout(stripeOptions);

    if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer.
        const displayError = document.getElementById('stripe-error-message');
        if (displayError){
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
    if (!checkoutButton){
        return;
    }
    checkoutButton.addEventListener('click', async () => {
        // When the customer clicks on the button, redirect
        // them to Checkout.
        await redirectToCheckoutWithPlanId(planId)
    });
}

