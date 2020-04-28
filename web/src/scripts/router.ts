import Vue from "vue";
import VueRouter, { Route, RouteConfig } from "vue-router";
import { PageRoute } from "@shared/PageRoutes";
import { logRouteChanged } from "@web/analytics";
import Logger from "@shared/Logger";
import { MetaRouteConfig, MetaTag, updateRouteMeta } from "@web/router-meta";

const logger = new Logger("router.ts");
Vue.use(VueRouter);

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
            title: "Sign Up | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
        }
    }, {
        component: () => import("@web/views/SignUpView.vue"),
        path: PageRoute.LOGIN,
        name: "Log In",
        meta: {
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
        component: () => import("@components/ValuesHome.vue"),
        name: "Values",
        path: PageRoute.VALUES_HOME,
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
        const meta = updateRouteMeta(to);
        logger.info("Setting page meta:", meta);
    } catch (error) {
        logger.error("Failed to udpate meta", error);
    } finally {
        next();
    }
});

router.afterEach((to, from) => {
    // document.title = to.name || "Cactus";
    logRouteChanged(to);
})


export default router;