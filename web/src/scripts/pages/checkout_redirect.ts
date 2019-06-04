import "styles/pages/checkout_redirect.scss"
import {configureStripe, redirectToCheckout} from "@web/checkoutService";
import {Config} from "@web/config";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@web/queryParams";

document.addEventListener('DOMContentLoaded', async () => {
    console.log("checkout monthly loaded");


    const productParam = getQueryParam(QueryParam.SUBSCRIPTION_PLAN);
    let planId = Config.stripe.monthlyPlanId;
    if (productParam && productParam.toLowerCase() === "y"){
        planId = Config.stripe.yearlyPlanId;
    }


    configureStripe('checkout-button', planId);
    setTimeout(async () => {
        await redirectToCheckout(planId);
    }, 1000)
});
