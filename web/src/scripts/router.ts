import VueRouter from "vue-router";
import { PageRoute } from "@shared/PageRoutes";
import { logRouteChanged } from "@web/analytics";
import Logger from "@shared/Logger";
import { MetaRouteConfig, updateRouteMeta } from "@web/router-meta";
import { isExternalUrl } from "@shared/util/StringUtil";

const logger = new Logger("router.ts");

const routes: MetaRouteConfig[] = [
    {
        component: () => import ("@web/views/HomePage.vue"),
        path: "/",
        name: "Cactus",
        meta: {
            title: "Cactus | Boost your mental fitness",
            description: "Research-backed prompts to increase self-awareness and resilience",
            metaTags: [],
            image: {
                url: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/static%2Fog-wall-of-blobs-big.png?alt=media&token=9c2ec0c0-3e76-4603-a5a4-8a79e1373574",
                height: 630,
                width: 1200,
                type: "image/png",
            }
        }
    },
    {
        component: () => import("@components/JournalHome.vue"),
        path: PageRoute.JOURNAL_HOME,
        name: "Home",
        meta: {
            title: "Journal | Home",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy."
        }
    },
    {
        component: () => import("@web/views/InsightsEmbedPage.vue"),
        path: PageRoute.INSIGHTS_EMBED,
        name: "Insights",
        meta: {
            title: "Insights",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy."
        }
    },
    {
        component: () => import("@web/views/SignUpView.vue"),
        path: PageRoute.SIGNUP,
        name: "Sign Up",
        meta: {
            usePrevious: true,
            title: "Sign Up | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
        }
    }, {
        component: () => import("@web/views/SignUpView.vue"),
        path: PageRoute.LOGIN,
        name: "Log In",
        meta: {
            usePrevious: true,
            title: "Log In | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
        }
    },
    {
        component: () => import("@web/views/PromptContentPage.vue"),
        path: `${ PageRoute.PROMPTS_ROOT }/:entryId`,
        name: "Prompt",
        meta: {
            title: "Reflection Prompt",
            description: "Take a moment for mindful reflection",
        }
    },
    {
        component: () => import("@web/views/TermsOfServicePage.vue"),
        path: PageRoute.TERMS_OF_SERVICE,
        name: "Terms of Service",
    },
    {
        path: PageRoute.VALUES_HOME,
        redirect: PageRoute.CORE_VALUES,
    },
    {
        component: () => import("@components/SharedReflectionPage.vue"),
        path: `${ PageRoute.SHARED_REFLECTION }/:reflectionId`,
        name: "Reflection"
    },
    {
        component: () => import("@components/AndroidWelcome.vue"),
        path: PageRoute.WELCOME,
        name: "Welcome",
    },
    {
        component: () => import("@components/MagicLinkAppContinue.vue"),
        path: PageRoute.NATIVE_APP_MAGIC_LINK_LOGIN,
        name: "App Login",
    },
    {
        component: () => import("@components/PricingPage.vue"),
        name: "Pricing",
        path: PageRoute.PRICING,
        meta: {
            title: "Cactus Plus",
            description: "Daily prompts, personal insights, and more",
            image: {
                url: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/static%2Fog-pricing-2020.jpg?alt=media&token=bfc2db3a-dc3d-4e38-8c57-8f58780947bc",
                height: 630,
                width: 1200,
                type: "image/jpeg",
            }
        }
    },
    {
        component: () => import("@components/SocialHome.vue"),
        name: "Friends & Activity | Cactus",
        path: PageRoute.SOCIAL,
    },
    {
        component: () => import("@components/SocialInvite.vue"),
        name: "Invite Friends | Cactus",
        path: PageRoute.FRIENDS
    },
    {
        component: () => import("@components/CoreValuesPage.vue"),
        path: PageRoute.CORE_VALUES,
        name: "Core Values",
    },
    {
        component: () => import("@components/EmailActionHandler.vue"),
        path: PageRoute.AUTHENTICATE_ACTIONS,
        name: "Authentication",
    },
    {
        component: () => import("@components/SponsorPage.vue"),
        path: PageRoute.SPONSOR,
        name: "Sponsor",
    },
    {
        component: () => import("@web/views/PrivacyPolicyPage.vue"),
        path: PageRoute.PRIVACY_POLICY,
        name: "Privacy Policy",
    },
    {
        component: () => import("@components/AccountSettings.vue"),
        path: PageRoute.ACCOUNT,
        name: "Account Settings",
    },
    {
        component: () => import("@web/views/PaymentCanceled.vue"),
        name: "Payment Canceled",
        path: PageRoute.PAYMENT_CANCELED,
    },
    {
        component: () => import("@components/UnsubscribeConfirmedPage.vue"),
        name: "Unsubscribe Confirmed",
        path: PageRoute.UNSUBSCRIBE_SUCCESS
    },
    {
        component: () => import("@web/views/StripeCheckoutRedirect.vue"),
        name: "Checkout",
        path: PageRoute.CHECKOUT,
    },
    {
        component: () => import("@web/views/SignupConfirmed.vue"),
        name: "Sign up",
        path: PageRoute.SIGNUP_CONFIRMED,
    },
    {
        component: () => import("@components/404.vue"),
        path: "*",
        name: "Page Not Found",
    },

]

const router = new VueRouter({
    mode: "history",
    // base: process.env.BASE_URL,
    routes,
    scrollBehavior(to, from, savedPosition) {
        return { x: 0, y: 0 }
    },
});

router.beforeEach((to, from, next) => {
    try {
        const meta = updateRouteMeta(to, from);
        logger.info("Setting page meta:", meta);
    } catch (error) {
        logger.error("Failed to update meta", error);
    } finally {
        next();
    }
});

router.beforeEach((to, from, next) => {
    try {
        const extUrl = to.fullPath.startsWith("/") ? to.fullPath.substring(1) : to.fullPath
        if (isExternalUrl(extUrl)) {
            window.location.href = extUrl;
            next();
            return;
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


export default router;