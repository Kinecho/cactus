// import * as Stripe from "stripe";
// import Stripe = stripe.Stripe;

// import Stripe = stripe.Stripe;
//
// declare interface Stripe{}
//
// interface NewStripe extends  Stripe {
//     redirectToCheckout(options?: any);
// }
//

export function configureStripe(checkoutButtonId){
    // noinspection JSUnresolvedFunction

    // @ts-ignore
    const stripe = Stripe('pk_test_cFV6bK7YpxB2QrTRYOJie00B');

    const checkoutButton = document.getElementById(checkoutButtonId);
    checkoutButton.addEventListener('click', function () {
        // When the customer clicks on the button, redirect
        // them to Checkout.
        // @ts-ignore
        stripe.redirectToCheckout({
            items: [{plan: 'plan_F6oBhRX9L4WKMB', quantity: 1}],

            // Do not rely on the redirect to the successUrl for fulfilling
            // purchases, customers may not always reach the success_url after
            // a successful payment.
            // Instead use one of the strategies described in
            // https://stripe.com/docs/payments/checkout/fulfillment
            successUrl: 'https://cactus-app-stage.web.app/success',
            cancelUrl: 'https://cactus-app-stage.web.app/cancel',
        })
            .then(function (result) {
                if (result.error) {
                    // If `redirectToCheckout` fails due to a browser or network
                    // error, display the localized error message to your customer.
                    var displayError = document.getElementById('stripe-error-message');
                    displayError.textContent = result.error.message;
                }
            });
    });
}

