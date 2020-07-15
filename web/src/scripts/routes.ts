import { Component } from "vue";
import LoadingPage from "@web/views/LoadingPage.vue";
import ErrorPage from "@web/views/ErrorPage.vue";
import { MetaRouteConfig } from "@web/router-meta";
import { PageRoute } from "@shared/PageRoutes";
import { QueryParam } from "@shared/util/queryParams";
import AndroidStart from "@web/views/AndroidStart.vue";
import { Screen } from "@components/gapanalysis/GapAssessmentTypes";

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
        timeout: 20000,
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

export const routes: MetaRouteConfig[] = [
    {
        path: "/loading",
        component: LoadingPage,
        meta: {
            navBar: true,
        }
    },
    {
        path: "/mlp",
        redirect: "/",
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/marketing/LandingPage.vue"
        )),
        meta: {
            navBar: true,
        },
        children: [
            {
                path: "gap",
                component: () => lazyLoadView(import(
                /* webpackPrefetch: true, webpackChunkName: "pages" */
                "@web/views/marketing/GapOnboarding.vue"
                )),
                meta: {
                    title: "Cactus | Boost your mental fitness",
                    description: "Research-backed prompts to increase self-awareness and resilience",
                    footer: { lifted: true },
                },
            },
            {
                path: "core-values",
                component: () => lazyLoadView(import(
                /* webpackPrefetch: true, webpackChunkName: "pages" */
                "@web/views/marketing/CoreValuesOnboarding.vue"
                )),
                meta: {
                    title: "Cactus | Boost your mental fitness",
                    description: "Research-backed prompts to increase self-awareness and resilience",
                    footer: { lifted: true },
                },
            },
            {
                path: "magic",
                component: () => lazyLoadView(import(
                /* webpackPrefetch: true, webpackChunkName: "pages" */
                "@web/views/marketing/MagicMomentOnboarding.vue"
                )),
                meta: {
                    title: "Cactus | Boost your mental fitness",
                    description: "Research-backed prompts to increase self-awareness and resilience",
                    footer: { lifted: true },
                },
            }, {
                path: "*",
                redirect: "/",
            }
        ]
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/HomePage.vue"
        )),
        path: "/",
        name: "Cactus",
        meta: {
            title: "Cactus | Boost your mental fitness",
            description: "Research-backed prompts to increase self-awareness and resilience",
            metaTags: [],
            navBar: {
                isSticky: true,
            },
            image: {
                url: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/static%2Fog-wall-of-blobs-big.png?alt=media&token=9c2ec0c0-3e76-4603-a5a4-8a79e1373574",
                height: 630,
                width: 1200,
                type: "image/png",
            }
        }
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackPreload: true, webpackChunkName: "pages" */
        "@web/views/InsightsPage.vue"
        )),
        path: PageRoute.MEMBER_HOME,
        alias: PageRoute.INSIGHTS,
        name: "Home",
        meta: {
            authRequired: true,
            passMember: true,
            title: "Home | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
            navBar: true,
        }
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackPreload: true, webpackChunkName: "pages" */
        "@components/JournalHome.vue"
        )),
        path: PageRoute.JOURNAL,
        name: "Journal",
        meta: {
            title: "Journal | Cactus",
            authRequired: true,
            passMember: true,
            navBar: {
                showLogin: false,
            }
        }
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/WordBubbleEmbedPage.vue")),
        path: PageRoute.INSIGHTS_EMBED,
        name: "Insights Embed",
        meta: {
            title: "Insights",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy."
        }
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/GetStartedPage.vue")),
        path: PageRoute.SIGNUP,
        alias: PageRoute.GET_STARTED,
        name: "Sign Up",
        meta: {
            usePrevious: true,
            title: "Sign Up | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
            navBar: {
                showLinks: false,
                showSignup: false,
                showLogin: false,
                redirectOnSignOut: false,
                isSticky: false,
                forceTransparent: true,
                largeLogoOnDesktop: true,
                whiteLogo: true,
            }
        }
    }, {
        component: () => lazyLoadView(import(/* webpackPreload: true, webpackPrefetch: true, webpackChunkName: "pages" */ "@web/views/SignUpView.vue")),
        path: PageRoute.LOGIN,
        alias: [PageRoute.SIGNUP_CONFIRMED],
        name: "Log In",
        meta: {
            usePrevious: true,
            title: "Log In | Cactus",
            description: "See yourself and the world more positively. Questions to help you become more mindful and reflect on what makes you happy.",
            navBar: {
                showLinks: false,
                showSignup: false,
                showLogin: false,
                redirectOnSignOut: false,
                isSticky: false,
                forceTransparent: true,
                largeLogoOnDesktop: true,
                whiteLogo: true,
            }
        }
    },
    /**
     * Legacy prompt page. New prompts should go to new page
     */
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackPreload: true, webpackChunkName: "pages" */
        "@web/views/LegacyPromptContentPage.vue")),
        path: `${ PageRoute.PROMPTS_ROOT }-legacy/:entryId`,
        name: "LegacyPrompt",
        meta: {
            title: "Reflection Prompt",
            description: "Take a moment for mindful reflection",
        }
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackPreload: true, webpackChunkName: "pages" */
        "@web/views/PromptPage.vue")),
        path: `${ PageRoute.PROMPTS_ROOT }/:id`,
        name: "Prompt",
        props: (route) => {
            const usePrompt = route.query[QueryParam.USE_PROMPT_ID] === "true";
            const pageParam = route.query[QueryParam.CONTENT_INDEX]
            return {
                _promptId: usePrompt ? route.params.id : null,
                _entryId: usePrompt ? null : route.params.id,
                page: Number(route.params.page ?? pageParam ?? 1)
            }
        },
        meta: {
            title: "Reflection Prompt",
            description: "Take a moment for mindful reflection",
            passMember: true,
            authRequired: true,
            authContinueMessage: "You must be signed in to view this content"
        },
        children: [
            {
                path: ":page",
                props: true,
                // meta: {
                // passMember: true,
                // authRequired: true,
                // authContinueMessage: "You must be signed in to view this content"
                // },
            }
        ]
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/TermsOfServicePage.vue")),
        path: PageRoute.TERMS_OF_SERVICE,
        name: "Terms of Service",
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/SharedReflectionPage.vue")),
        path: `${ PageRoute.SHARED_REFLECTION }/:reflectionId`,
        name: "Reflection"
    },
    {
        path: PageRoute.WELCOME,
        component: AndroidStart,
        name: "Welcome",
        meta: {
            passMember: true,
        }
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/MagicLinkAppContinue.vue")),
        path: PageRoute.NATIVE_APP_MAGIC_LINK_LOGIN,
        name: "App Login",
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/PricingPage.vue")),
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
            },
            navBar: { loginRedirectUrl: PageRoute.PRICING },
        }
    },
    {
        component: () => lazyLoadView(import(
        /* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/SocialHome.vue")),
        name: "Friends & Activity | Cactus",
        path: PageRoute.SOCIAL,
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/SocialInvite.vue")),
        name: "Invite Friends | Cactus",
        path: PageRoute.FRIENDS
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/CoreValuesPage.vue")),
        path: PageRoute.CORE_VALUES,
        name: "Core Values",
        meta: {
            title: "Discover your core values",
            description: "Core values are the general expression of what is most important for you, and they help you " +
            "understand past decisions and make better decisions in the future."
        }
    },
    {
        path: PageRoute.GAP_ANALYSIS,
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/GapAnalysisPage.vue")),
        name: "GapAnalysisPage",
        meta: {
            title: "Happiness Quiz | Cactus"
        },
        props: (route) => {
            return {
                resultsId: route.params.resultsId,
                screen: route.params.screen ?? Screen.intro,
                questionIndex: route.params.screen === Screen.questions ? Number(route.params.index ?? 0) : 0,
            }
        },
        children: [
            {
                path: ":resultsId",
                props: true,
                children: [
                    {
                        path: ":screen",
                        props: true,
                        children: [
                            {
                                path: ":index",
                            },
                        ]
                    }
                ]
            }
        ]
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/EmailActionHandler.vue")),
        path: PageRoute.AUTHENTICATE_ACTIONS,
        name: "Authentication",
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/SponsorPage.vue")),
        path: PageRoute.SPONSOR,
        name: "Sponsor",
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/PrivacyPolicyPage.vue")),
        path: PageRoute.PRIVACY_POLICY,
        name: "Privacy Policy",
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/AccountSettings.vue")),
        path: PageRoute.ACCOUNT,
        name: "Account Settings",
        meta: {
            passMember: true,
            authRequired: true,
            passSettings: true,
            passUser: true,
            navBar: { isSticky: false },
        }
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/PaymentCanceled.vue")),
        name: "Payment Canceled",
        path: PageRoute.PAYMENT_CANCELED,
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/UnsubscribeConfirmedPage.vue")),
        name: "Unsubscribe Confirmed",
        path: PageRoute.UNSUBSCRIBE_SUCCESS
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/StripeCheckoutRedirect.vue")),
        name: "Checkout",
        path: PageRoute.CHECKOUT,
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/PromotionLandingView.vue")),
        name: "Promotions",
        props: true,
        path: `${ PageRoute.PROMOS_ROOT }/:slug`,
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@web/views/OnboardingPage.vue")),
        name: "Onboarding",
        path: PageRoute.HELLO_ONBOARDING,
        meta: {
            passMember: true,
            authRequired: true,
            // navBar: false,
        },
        props: (route) => {
            return {
                // page: route.params.page ? Number(route.params.page) : 1,
                pageStatus: route.params.status ?? null,
                slug: route.params.slug,
            }
        },
        children: [
            {
                path: ":slug",
                props: true,
                children: [{
                    path: ":status",
                    props: true,
                }]
            }
        ]
    },
    {
        component: () => lazyLoadView(import(/* webpackPrefetch: true, webpackChunkName: "pages" */
        "@components/404.vue")),
        path: "*",
        name: "Page Not Found",
    },

]
