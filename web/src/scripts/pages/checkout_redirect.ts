import "@styles/pages/checkout_redirect.scss"
import {configureStripe, redirectToCheckoutWithPlanId, redirectToCheckoutWithSessionId} from "@web/checkoutService";
import {Config} from "@web/config";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {CreateSessionRequest} from "@shared/api/CheckoutTypes";
import {commonInit} from "@web/common";
commonInit();

document.addEventListener('DOMContentLoaded', async () => {
    console.log("checkout monthly loaded");


    const productParam = getQueryParam(QueryParam.SUBSCRIPTION_PLAN);

    let planId:string|undefined = undefined;

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

        setTimeout(async () => {
            const error = await redirectToCheckoutWithSessionId(request);
            if (error){
                showError("We were unable to send you to the checkout page. Please try again later.");
            }
        }, 1000);
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

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}