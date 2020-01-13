import "@styles/pages/payment_cancel.scss"
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("payment_cancel.ts");
commonInit();

document.addEventListener('DOMContentLoaded', function() {
    logger.log("payment cancel loaded")
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}