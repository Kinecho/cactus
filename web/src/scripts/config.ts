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

export const Config: {
    appCustomScheme: string,
    googleAnalyticsID: string,
    googleOptimizeID: string,
    facebookPixelID: string,
    firebase: FirebaseConfig,
    flamelinkFirebaseConfig: FirebaseConfig,
    flamelinkEnvironmentId: string,
    firstPromptId: string,
    cloudSpongeKey: string,
    appStoreUrl: string,
    playStoreUrl: string,
    apiDomain: string,
    stripe: StripeConfig,
    domain: string,
    firebaseDynamicLink: FirebaseDynamicLinkConfig,
    sentry: SentryConfig,
    env: string,
    isDev: boolean,
    isStage: boolean,
    isProd: boolean,
    version: string | undefined,
    androidUserAgent: string,
    iosUserAgent: string,
    branchLiveKey: string,
    revenueCatApiKey: string,
} = {
    appCustomScheme: process.env.__APP_CUSTOM_SCHEME__ as any,
    googleAnalyticsID: process.env.__GOOGLE_ANALYTICS_ID__ as any,
    googleOptimizeID: process.env.__GOOGLE_OPTIMIZE_ID__ as any,
    facebookPixelID: process.env.__FACEBOOK_PIXEL_ID__ as any,
    firebase: process.env.__FIREBASE_CONFIG__ as any,
    flamelinkFirebaseConfig: process.env.__FLAMELINK_FIREBASE_CONFIG__ as any,
    flamelinkEnvironmentId: process.env.__FLAMELINK_ENV_ID__ as any,
    firstPromptId: process.env.__FIRST_PROMPT_ID__ as any,
    cloudSpongeKey: process.env.__CLOUDSPONGE_KEY__ as any,
    appStoreUrl: process.env.__APP_STORE_URL__ as any,
    playStoreUrl: process.env.__PLAY_STORE_URL__ as any,
    apiDomain: process.env.__API_DOMAIN__ as any,
    stripe: process.env.__STRIPE_CONFIG__ as any,
    domain: process.env.__PUBLIC_DOMAIN__ as any,
    firebaseDynamicLink: process.env.__FIREBASE_DYNAMIC_LINK__ as any,
    sentry: process.env.__SENTRY__ as any,
    env: process.env.__BUILD_ENV__ as any,
    isDev: process.env.__BUILD_ENV__ === "dev",
    isStage: process.env.__BUILD_ENV__ === "stage",
    isProd: process.env.__BUILD_ENV__ === "prod",
    version: process.env.__SENTRY_VERSION__ as any,
    androidUserAgent: "CactusAndroid",
    iosUserAgent: "CactusIos",
    branchLiveKey: process.env.__BRANCH_LIVE_KEY__ as any,
    revenueCatApiKey: process.env.__REVENUECAT_API_KEY__ as any,
};
