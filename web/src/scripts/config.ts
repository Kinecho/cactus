
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

//these variables come from the webpack Define plugin
declare var __GOOGLE_ANALYTICS_ID__: string;
declare var __FIREBASE_CONFIG__: FirebaseConfig;
declare var __API_DOMAIN__: string;
declare var __FULL_STORY_TEAM_ID__: string;
declare var __STRIPE_CONFIG__: StripeConfig;
declare var __PUBLIC_DOMAIN__: string;

export const Config = {
    googleAnalyticsID: __GOOGLE_ANALYTICS_ID__,
    firebase: __FIREBASE_CONFIG__,
    apiDomain: __API_DOMAIN__,
    fullStoryTeamId: __FULL_STORY_TEAM_ID__,
    stripe: __STRIPE_CONFIG__,
    domain: __PUBLIC_DOMAIN__,
};