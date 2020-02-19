import "@styles/pages/checkout_redirect.scss"
import {startCheckout} from "@web/checkoutService";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("checkout_redirect.ts");

commonInit();

document.addEventListener('DOMContentLoaded', async () => {
    logger.log("checkout monthly loaded");

    const subscriptionProductId = getQueryParam(QueryParam.SUBSCRIPTION_PRODUCT_ID);

    if (!subscriptionProductId) {
        logger.error("No plan id provided. show error message");
        showError("It looks like this link is no longer valid. Please try again later.")
    } else {
        await startCheckout({subscriptionProductId: subscriptionProductId});
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