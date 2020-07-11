import Logger from "@shared/Logger";
import { RawLocation } from "vue-router";
import router from "@web/router";

const logger = new Logger("NavigationUtil");

export async function pushRoute(rawLocation: RawLocation) {
    try {
        await router.push(rawLocation);
    } catch (error) {
        if (error?.name !== "NavigationDuplicated") {
            logger.error(`Failed to push to route ${ rawLocation }`, error)
        }
        logger.warn("navigation push error", error);
    }
}