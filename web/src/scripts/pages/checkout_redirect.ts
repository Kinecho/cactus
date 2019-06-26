import "@styles/pages/checkout_redirect.scss"
import {configureStripe, redirectToCheckoutWithPlanId, redirectToCheckoutWithSessionId} from "@web/checkoutService";
import {Config} from "@web/config";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@web/queryParams";
import {CreateSessionRequest} from "@shared/api/CheckoutTypes";

document.addEventListener('DOMContentLoaded', async () => {
    console.log("checkout monthly loaded");


    const productParam = getQueryParam(QueryParam.SUBSCRIPTION_PLAN);

    let planId = undefined;

    if (productParam && productParam.toLowerCase() === "y"){
        planId = Config.stripe.yearlyPlanId;
    } else if (productParam){
        planId = productParam;
    }


    if (!planId){
        const request:CreateSessionRequest = {
            successUrl: `${Config.domain}/success`,
            cancelUrl: `${Config.domain}`,
            preOrder: true,
        };

        const error = await redirectToCheckoutWithSessionId(request);
        if (error){
            showError("We were unable to send you to the checkout page. Please try again later.");
        }

    } else {
        configureStripe('checkout-button', planId);
        setTimeout(async () => {
            await redirectToCheckoutWithPlanId(planId);
        }, 1000)
    }



});




function showError( message:string) {
    const $error = document.getElementById("error-message");
    const $loading = document.getElementById("loading-message");



    if ($error){
        $error.classList.toggle("hidden");
        $error.getElementsByClassName("message")[0].textContent = message;
    }
    if ($loading){
        $loading.classList.toggle("hidden");
    }

}