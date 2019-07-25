export interface StripeConfig {
    apiKey: string,
    monthlyPlanId: string,
    yearlyPlanId: string,
}

export interface FirebaseConfig {
    apiKey: string,
    authDomain: string,
    databaseURL: string,
    projectId: string,
    storageBucket: string,
    messagingSenderId: string,
    appId: string,
}

export interface FirebaseDynamicLinkConfig {
    domain: string,
    prefix: string
}

export interface SentryConfig {
    dsn: string,
}

//these variables come from the webpack Define plugin
declare var __GOOGLE_ANALYTICS_ID__: string;
declare var __GOOGLE_OPTIMIZE_ID__: string;
declare var __FIREBASE_CONFIG__: FirebaseConfig;
declare var __API_DOMAIN__: string;
declare var __FULL_STORY_TEAM_ID__: string;
declare var __STRIPE_CONFIG__: StripeConfig;
declare var __PUBLIC_DOMAIN__: string;
declare var __FIREBASE_DYNAMIC_LINK__: FirebaseDynamicLinkConfig;
declare var __SENTRY__: SentryConfig;
declare var __SENTRY_VERSION__: string | undefined;

declare var __BUILD_ENV__: string;
export const Config = {
    googleAnalyticsID: __GOOGLE_ANALYTICS_ID__,
    googleOptimizeID: __GOOGLE_OPTIMIZE_ID__,
    firebase: __FIREBASE_CONFIG__,
    apiDomain: __API_DOMAIN__,
    fullStoryTeamId: __FULL_STORY_TEAM_ID__,
    stripe: __STRIPE_CONFIG__,
    domain: __PUBLIC_DOMAIN__,
    firebaseDynamicLink: __FIREBASE_DYNAMIC_LINK__,
    sentry: __SENTRY__,
    env: __BUILD_ENV__,
    isDev: __BUILD_ENV__ === "dev",
    isStage: __BUILD_ENV__ === "stage",
    isProd: __BUILD_ENV__ === "prod",
    version: __SENTRY_VERSION__
};