import {Config} from "@web/config";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import Stripe = stripe.Stripe;
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import {Endpoint, request} from "@web/requestUtils";
import {gtag} from "@web/analytics";

// import * as Stripe from "stripe";
// import Stripe = stripe.Stripe;

// import Stripe = stripe.Stripe;
//
// declare interface Stripe{}
//
interface CactusStripe extends Stripe {
    redirectToCheckout(options?: any);

}

export async function redirectToCheckoutWithSessionId(sessionRequest:CreateSessionRequest, errorElementId:string|undefined="stripe-error-message"):Promise<any|null|undefined> {
    const stripe = Stripe(Config.stripe.apiKey) as CactusStripe;

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



export async function redirectToCheckoutWithPlanId(planId:string=Config.stripe.monthlyPlanId) {
    const stripe = Stripe(Config.stripe.apiKey) as CactusStripe;

    const stripeOptions:any = {
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

    const email = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
    if (email){
        stripeOptions.customerEmail = email;
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
        displayError.textContent = result.error.message;
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
    checkoutButton.addEventListener('click', async () => {
        // When the customer clicks on the button, redirect
        // them to Checkout.
        await redirectToCheckoutWithPlanId(planId)
    });
}

