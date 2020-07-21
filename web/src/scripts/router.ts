import VueRouter from "vue-router";
import { PageRoute } from "@shared/PageRoutes";
import { logRouteChanged } from "@web/analytics";
import Logger from "@shared/Logger";
import { RoutePageMeta, updateRouteMeta } from "@web/router-meta";
import { isBlank, isExternalUrl } from "@shared/util/StringUtil";
import CactusMemberService from "@web/services/CactusMemberService";
import { QueryParam } from "@shared/util/queryParams";
import { routes } from "@web/routes";

const logger = new Logger("router.ts");

const router = new VueRouter({
    mode: "history",
    // base: process.env.BASE_URL,
    routes,
    scrollBehavior(to, from, savedPosition) {
        return { x: 0, y: 0 }
    },
});

const authReady = CactusMemberService.sharedInstance.ready

/**
 * Update route metadata
 */
router.beforeEach((to, from, next) => {
    try {
        updateRouteMeta(to, from);
        if (!(to.meta as RoutePageMeta).asyncMeta) {
            window.prerenderReady = true;
        }
    } catch (error) {
        logger.error("Failed to update meta", error);
    } finally {
        next();
    }
});

//we now can trust the member has been loaded from auth during app start
router.beforeEach(async (to, from, next) => {
    await authReady
    try {
        const extUrl = to.fullPath.startsWith("/") ? to.fullPath.substring(1) : to.fullPath
        if (isExternalUrl(extUrl)) {
            window.location.href = extUrl;
            next();
            return;
        } else if (to.meta.authRequired && !CactusMemberService.sharedInstance.isLoggedIn) {
            const query: Record<string, string> = {
                [QueryParam.REDIRECT_URL]: to.fullPath
            }
            if (!isBlank(to.meta.authContinueMessage)) {
                query[QueryParam.MESSAGE] = to.meta.authContinueMessage;
            }
            next({
                path: PageRoute.SIGNUP,
                query,
            })
        } else {
            next();
        }
    } catch (error) {
        logger.error("Failed to handle before each check for external url. Sending to next", error);
        next();
    }
})

router.afterEach((to, from) => {
    // document.title = to.name || "Cactus";
    logRouteChanged(to);
})


export default router