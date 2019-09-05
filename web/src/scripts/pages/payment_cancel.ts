import "@styles/pages/payment_cancel.scss"
import {commonInit} from "@web/common";

commonInit();

document.addEventListener('DOMContentLoaded', function() {
    console.log("payment cancel loaded")
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}