//these variables come from the webpack Define plugin
declare var __GOOGLE_ANALYTICS_ID__: string;
declare var __FIREBASE_CONFIG__: string;

export const Config = {
    googleAnalyticsID: __GOOGLE_ANALYTICS_ID__,
    firebase: __FIREBASE_CONFIG__
};