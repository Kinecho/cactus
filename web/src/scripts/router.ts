import VueRouter from "vue-router";
import { PageRoute } from "@shared/PageRoutes";
import { logRouteChanged } from "@web/analytics";
import Logger from "@shared/Logger";
import { MetaRouteConfig, updateRouteMeta } from "@web/router-meta";
import { isExternalUrl } from "@shared/util/StringUtil";
import LoadingPage from "@web/views/LoadingPage.vue";
import ErrorPage from "@web/views/ErrorPage.vue";
import { Component, AsyncComponent } from "vue";

const logger = new Logger("router.ts");

function lazyLoadView(AsyncView: any): Promise<Component<any>> {
    const AsyncHandler = (): any => ({
        component: AsyncView,
        // A component to use while the component is loading.
        loading: LoadingPage,
        // Delay before showing the loading component.
        // Default: 200 (milliseconds).
        delay: 400,
        // A fallback component in case the timeout is exceeded
        // when loading the component.
        error: ErrorPage,
        // Time before giving up trying to load the component.
        // Default: Infinity (milliseconds).
        timeout: 10000,
    })

    return Promise.resolve<Component<any>>({
        functional: true,
        render(h, params) {
            // Transparently pass any props or children
            // to the view component.
            return h(AsyncHandler, params.data, params.children)
        },
    })
}

const routes: MetaRouteConfig[] = [
    {
        path: "/loading",
        component: LoadingPage,
    },
    {
        component: () => lazyLoadView(import("@web/views/HomePage.vue")),
        path: "/",
        name: "Cactus",
        meta: {
            title: "Cactus | What makes you happy?",
            description: "Questions designed to improve how you think about your work, life, relationships, and emotions",
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
        component: () => lazyLoadView(import("@components/JournalHome.vue")),
        path: PageRoute.JOURNAL_HOME,
        name: "Home",
        meta: {
            title: "Journal | Home",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy."
        }
    },
    {
        component: () => lazyLoadView(import("@web/views/WordBubbleEmbedPage.vue")),
        path: PageRoute.INSIGHTS_EMBED,
        name: "Insights Embed",
        meta: {
            title: "Insights",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy."
        }
    },
    {
        component: () => lazyLoadView(import("@web/views/SignUpView.vue")),
        path: PageRoute.SIGNUP,
        name: "Sign Up",
        meta: {
            usePrevious: true,
            title: "Sign Up | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
        }
    }, {
        component: () => lazyLoadView(import("@web/views/SignUpView.vue")),
        path: PageRoute.LOGIN,
        name: "Log In",
        meta: {
            usePrevious: true,
            title: "Log In | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
        }
    },
    {
        component: () => lazyLoadView(import("@web/views/PromptContentPage.vue")),
        path: `${ PageRoute.PROMPTS_ROOT }/:entryId`,
        name: "Prompt",
        meta: {
            title: "Reflection Prompt",
            description: "Take a moment for mindful reflection",
        }
    },
    {
        component: () => lazyLoadView(import("@web/views/TermsOfServicePage.vue")),
        path: PageRoute.TERMS_OF_SERVICE,
        name: "Terms of Service",
    },
    {
        path: PageRoute.VALUES_HOME,
        redirect: PageRoute.CORE_VALUES,
    },
    {
        component: () => lazyLoadView(import("@components/SharedReflectionPage.vue")),
        path: `${ PageRoute.SHARED_REFLECTION }/:reflectionId`,
        name: "Reflection"
    },
    {
        component: () => lazyLoadView(import("@components/AndroidWelcome.vue")),
        path: PageRoute.WELCOME,
        name: "Welcome",
    },
    {
        component: () => lazyLoadView(import("@components/MagicLinkAppContinue.vue")),
        path: PageRoute.NATIVE_APP_MAGIC_LINK_LOGIN,
        name: "App Login",
    },
    {
        component: () => lazyLoadView(import("@components/PricingPage.vue")),
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
        component: () => lazyLoadView(import("@components/SocialHome.vue")),
        name: "Friends & Activity | Cactus",
        path: PageRoute.SOCIAL,
    },
    {
        component: () => lazyLoadView(import("@components/SocialInvite.vue")),
        name: "Invite Friends | Cactus",
        path: PageRoute.FRIENDS
    },
    {
        component: () => lazyLoadView(import("@components/CoreValuesPage.vue")),
        path: PageRoute.CORE_VALUES,
        name: "Core Values",
        meta: {
            title: "Discover your core values",
            description: "Core values are the general expression of what is most important for you, and they help you " +
            "understand past decisions and make better decisions in the future."
        }
    },
    {
        path: PageRoute.VALUES_HOME,
        redirect: PageRoute.CORE_VALUES,
    },
    {
        path: PageRoute.GAP_ANALYSIS,
        component: () => import("@web/views/GapAnalysisPage.vue"),
        name: "GapAnalysisPage",
        meta: {
            title: "Gap Analysis | Cactus"
        }
    },
    {
        component: () => lazyLoadView(import("@components/EmailActionHandler.vue")),
        path: PageRoute.AUTHENTICATE_ACTIONS,
        name: "Authentication",
    },
    {
        component: () => lazyLoadView(import("@components/SponsorPage.vue")),
        path: PageRoute.SPONSOR,
        name: "Sponsor",
    },
    {
        component: () => lazyLoadView(import("@web/views/PrivacyPolicyPage.vue")),
        path: PageRoute.PRIVACY_POLICY,
        name: "Privacy Policy",
    },
    {
        component: () => lazyLoadView(import("@components/AccountSettings.vue")),
        path: PageRoute.ACCOUNT,
        name: "Account Settings",
    },
    {
        component: () => lazyLoadView(import("@web/views/PaymentCanceled.vue")),
        name: "Payment Canceled",
        path: PageRoute.PAYMENT_CANCELED,
    },
    {
        component: () => lazyLoadView(import("@components/UnsubscribeConfirmedPage.vue")),
        name: "Unsubscribe Confirmed",
        path: PageRoute.UNSUBSCRIBE_SUCCESS
    },
    {
        component: () => lazyLoadView(import("@web/views/StripeCheckoutRedirect.vue")),
        name: "Checkout",
        path: PageRoute.CHECKOUT,
    },
    {
        component: () => lazyLoadView(import("@web/views/SignupConfirmed.vue")),
        name: "Sign up",
        path: PageRoute.SIGNUP_CONFIRMED,
    },
    {
        component: () => lazyLoadView(import("@web/views/InsightsPage.vue")),
        name: "Insights",
        path: PageRoute.INSIGHTS,
    },
    {
        component: () => lazyLoadView(import("@components/404.vue")),
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