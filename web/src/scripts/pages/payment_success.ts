import "@styles/pages/payment_success.scss"
import {gtag} from "@web/analytics";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

commonInit();
const logger = new Logger("payment_success.ts");
document.addEventListener('DOMContentLoaded', function() {
    logger.log("payment success loaded");

    const amount = getQueryParam(QueryParam.PURCHASE_AMOUNT);

    const subscriptionProductId = getQueryParam(QueryParam.SUBSCRIPTION_PRODUCT_ID);

    gtag('event', 'purchase', {
        value: amount,
        currency: 'USD',
        items: [subscriptionProductId]
    });


});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}