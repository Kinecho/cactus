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
declare var __APP_CUSTOM_SCHEME__: string;
declare var __GOOGLE_ANALYTICS_ID__: string;
declare var __GOOGLE_OPTIMIZE_ID__: string;
declare var __FACEBOOK_PIXEL_ID__: string;
declare var __FIREBASE_CONFIG__: FirebaseConfig;
declare var __FLAMELINK_FIREBASE_CONFIG__: FirebaseConfig;
declare var __FLAMELINK_ENV_ID__: string;
declare var __FIRST_PROMPT_ID__: string;
declare var __CLOUDSPONGE_KEY__: string;
declare var __APP_STORE_URL__: string;

declare var __API_DOMAIN__: string;
declare var __STRIPE_CONFIG__: StripeConfig;
declare var __PUBLIC_DOMAIN__: string;
declare var __FIREBASE_DYNAMIC_LINK__: FirebaseDynamicLinkConfig;
declare var __SENTRY__: SentryConfig;
declare var __SENTRY_VERSION__: string | undefined;

declare var __BUILD_ENV__: string;
export const Config = {
    appCustomScheme: __APP_CUSTOM_SCHEME__,
    googleAnalyticsID: __GOOGLE_ANALYTICS_ID__,
    googleOptimizeID: __GOOGLE_OPTIMIZE_ID__,
    facebookPixelID: __FACEBOOK_PIXEL_ID__,
    firebase: __FIREBASE_CONFIG__,
    flamelinkFirebaseConfig: __FLAMELINK_FIREBASE_CONFIG__,
    flamelinkEnvironmentId: __FLAMELINK_ENV_ID__,
    firstPromptId: __FIRST_PROMPT_ID__,
    cloudSpongeKey: __CLOUDSPONGE_KEY__,
    appStoreUrl: __APP_STORE_URL__,
    apiDomain: __API_DOMAIN__,
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