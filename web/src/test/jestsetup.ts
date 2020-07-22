import { setTimestamp } from "@shared/util/FirestoreUtil";

window.__APP_CUSTOM_SCHEME__ = "app.stage-cactus";
window.__GOOGLE_ANALYTICS_ID__ = 'UA-127159143-6';
window.__GOOGLE_OPTIMIZE_ID__ = '';
window.__FACEBOOK_PIXEL_ID__ = '';
window.__FIRST_PROMPT_ID__ = '12345';
window.__CLOUDSPONGE_KEY__ = 'localhost';
window.__API_DOMAIN__ = 'https://us-central1-cactus-app-stage.cloudfunctions.net';
window.__PUBLIC_DOMAIN__ = 'https://cactus-app-stage.web.app';
window.__BUILD_ENV__ = 'stage';
window.__FIREBASE_CONFIG__ = {
    apiKey: 'AIzaSyA8q6tz-bzx5NM9bqEYS8xZ7NHpCffo-q0',
    authDomain: 'cactus-app-stage.firebaseapp.com',
    databaseURL: 'https://cactus-app-stage.firebaseio.com',
    projectId: 'cactus-app-stage',
    storageBucket: 'cactus-app-stage.appspot.com',
    messagingSenderId: '88457335033',
    appId: '1:88457335033:web:e731bd6b336daeb6',
};
window.__STRIPE_CONFIG__ = {
    apiKey: 'pk_test_cFV6bK7YpxB2QrTRYOJie00B', //this is the test id. update for prod
    monthlyPlanId: 'plan_F6oBhRX9L4WKMB', //this is no longer valid - this is a test id
    yearlyPlanId: 'plan_FC2EkJJoDXBzCO',
};
window.__FIREBASE_DYNAMIC_LINK__ = {
    domain: 'cactusstage.page.link',
    prefix: '',
};
window.__SENTRY__ = {
    dsn: 'https://d41561516bba4e04b0d10a1526c83c27@sentry.io/1490133',
};
window.__SENTRY_VERSION__ = 'test';
window.__APP_STORE_URL__ = "https://apple.com/test"


window.__FLAMELINK_FIREBASE_CONFIG__ = window.__FIREBASE_CONFIG__;
window.__FLAMELINK_ENV_ID__ = "stage";
window.__BRANCH_LIVE_KEY__ = "key_test";

const firebasemock = require('firebase-mock');
import * as firebase from "firebase";

export const mockauth = new firebasemock.MockAuthentication();
const mockfirestore = new firebasemock.MockFirestore();
const mockstorage = new firebasemock.MockStorage();
export const mockFirebase = new firebasemock.MockFirebaseSdk(
// use null if your code does not use RTDB
(path: any) => {
    return null
},
// use null if your code does not use AUTHENTICATION
() => {
    return mockauth
},
// use null if your code does not use FIRESTORE
() => {
    return mockfirestore
},
// use null if your code does not use STORAGE
() => {
    return mockstorage
},
// use null if your code does not use MESSAGING
() => {
    return null
},
);