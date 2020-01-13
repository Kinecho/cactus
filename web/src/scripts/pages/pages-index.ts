import "@styles/pages-index.scss"
import {setupNavigation} from "@web/NavigationUtil";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("pages-index.ts");

commonInit();
setupNavigation({showSignupButton: false});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}