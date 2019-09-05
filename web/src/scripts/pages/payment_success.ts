import "@styles/pages/payment_success.scss"
import {gtag} from "@web/analytics";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {commonInit} from "@web/common";

commonInit();
document.addEventListener('DOMContentLoaded', function() {
    console.log("payment success loaded");

    const amount = getQueryParam(QueryParam.PURCHASE_AMOUNT);

    const itemId = getQueryParam(QueryParam.PURCHASE_ITEM_ID);

    gtag('event', 'purchase', {
        value: amount,
        currency: 'USD',
        items: [itemId]
    });


});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}