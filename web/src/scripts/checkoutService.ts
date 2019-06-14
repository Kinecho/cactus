import {Config} from "@web/config";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@web/queryParams";
import Stripe = stripe.Stripe;

// import * as Stripe from "stripe";
// import Stripe = stripe.Stripe;

// import Stripe = stripe.Stripe;
//
// declare interface Stripe{}
//
interface CactusStripe extends Stripe {
    redirectToCheckout(options?: any);

}


export async function redirectToCheckout(planId:string=Config.stripe.monthlyPlanId) {
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
        await redirectToCheckout(planId)
    });
}

