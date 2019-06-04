import "styles/pages/checkout_monthly.scss"
import {configureStripe, redirectToCheckout} from "@web/checkout";


document.addEventListener('DOMContentLoaded', async () => {
    console.log("checkout monthly loaded");
    configureStripe('checkout-button');
    await redirectToCheckout();
});
