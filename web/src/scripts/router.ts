import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import { PageRoute } from "@shared/PageRoutes";
import { routeChanged } from "@web/analytics";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
    {
        component: () => import ("@web/views/HomePage.vue"),
        path: "/",
        name: "Cactus",
    },
    {
        component: () => import("@web/views/InsightsEmbedPage.vue"),
        path: PageRoute.INSIGHTS_EMBED,
        name: "Insights"
    },
    {
        component: () => import("@components/JournalHome.vue"),
        path: PageRoute.JOURNAL_HOME,
        name: "Home",
    }, {
        component: () => import("@web/views/SignUpView.vue"),
        path: PageRoute.SIGNUP,
        name: "Sign Up",
    }, {
        component: () => import("@web/views/SignUpView.vue"),
        path: PageRoute.LOGIN,
        name: "Log In",
    },
    {
        component: () => import("@web/views/PromptContentPage.vue"),
        path: `${ PageRoute.PROMPTS_ROOT }/:entryId`,
        name: "Prompt",
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

router.afterEach((to, from) => {
    document.title = to.name || "Cactus";
    routeChanged(to);
})


export default router;