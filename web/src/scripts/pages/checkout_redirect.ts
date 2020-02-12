import "@styles/pages/checkout_redirect.scss"
import {
    configureStripe,
    redirectToCheckoutWithPlanId,
    redirectToCheckoutWithSessionId,
    startCheckout
} from "@web/checkoutService";
import {Config} from "@web/config";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {CreateSessionRequest} from "@shared/api/CheckoutTypes";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("checkout_redirect.ts");

commonInit();

document.addEventListener('DOMContentLoaded', async () => {
    logger.log("checkout monthly loaded");


    const productParam = getQueryParam(QueryParam.SUBSCRIPTION_PLAN);

    let planId: string | undefined = undefined;

    if (productParam && productParam.toLowerCase() === "y") {
        planId = Config.stripe.yearlyPlanId;
    } else if (productParam && productParam.toLowerCase() === "m") {
        planId = Config.stripe.monthlyPlanId;
    } else if (productParam) {
        planId = productParam;
    }


    if (!planId) {
        logger.error("No plan id provided. show error message");
        showError("It looks like this link is no longer valid. Please try again later.")
    } else {
        configureStripe('checkout-button', planId);
        await startCheckout({stripePlanId: planId});
    }

});


function showError(message: string) {
    const $error = document.getElementById("error-message");
    const $loading = document.getElementById("loading-message");


    if ($error) {
        $error.classList.toggle("hidden");
        $error.getElementsByClassName("message")[0].textContent = message;
    }
    if ($loading) {
        $loading.classList.toggle("hidden");
    }

}

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}