import {Config} from './config'
import {QueryParam} from "@shared/util/queryParams";
import {getQueryParam} from "@web/util";
import Vue from 'vue'
import * as Integrations from '@sentry/integrations';

import * as Sentry from '@sentry/browser';
import {User} from "firebase/app"
import {getAuth} from "@web/firebase";
import {LocalStorageKey} from "@web/services/StorageService";

declare global {
    interface Window {
        dataLayer: Array<any>;
        FS: {
            identify: (userId: string | boolean, options?: {
                displayName?: string | null,
                email?: string | null,
            }) => void
        }
    }
}

let _gtag: null | ((name: string, event?: any, options?: any) => void) = null;

/**
 * gtag('event', <action>, {
      'event_category': <category>,
      'event_label': <label>,
      'value': <value>
    });
 * @type {_gtag|*}
 */
export const gtag = createGTag();


let hasInit = false;

/**
 * set up the analytics function
 *
 * returns function
 */
export function init() {
    if (hasInit) {
        console.warn("Analytics already initialized, not reinitializing");
        return;
    }


    getAuth().onAuthStateChanged(user => {
        setUser(user);
        if (user) {
            console.log("User has logged in, removing any tracking/referral info");
        }

    });

    const sentryIntegrations = [];
    if (!Config.isDev) {
        sentryIntegrations.push(new Integrations.Vue({Vue, attachProps: true}));
        Sentry.init({
            dsn: Config.sentry.dsn,
            release: Config.version,
            environment: Config.env,
            integrations: sentryIntegrations,
        });
    }

    console.log("version is ", Config.version);

    // if ()


    createGTag();
    gtag('js', new Date());
    gtag('config', Config.googleAnalyticsID, {'optimize_id': Config.googleOptimizeID});

    const mailchimpUserId = getQueryParam(QueryParam.MAILCHIMP_EMAIL_ID);
    if (mailchimpUserId) {
        setUserId(`mcuid_${mailchimpUserId}`);
    }

    hasInit = true;
}

/**
 * Clear tracking cookies and local storage items
 */
export function clearTrackingData() {
    try {
        window.localStorage.removeItem(LocalStorageKey.referredByEmail);
        window.localStorage.removeItem(LocalStorageKey.emailAutoFill);
    } catch (e) {
        console.error("Failed to clear tracking data", e);
    }
}

export function setUserId(userId?: string) {
    gtag('set', {'user_id': userId}); // Set the user ID using signed-in user_id.}
    gtag('config', Config.googleAnalyticsID, {
        'user_id': userId,
        'custom_map': {'dimension1': userId}
    });
}

export function setUser(user?: User | null) {
    if (user) {
        const email = user.email;
        setUserId(user.uid);

        const sentryUser: Sentry.User = {
            id: user.uid,
            email: email || undefined,
        };

        Sentry.setUser(sentryUser);
        
    } else {
        setUserId(undefined);
        Sentry.setUser(null);
    }
}

export function fireConfirmedSignupEvent() {
    /* Facebook */
    if (window.fbq) {
        window.fbq('track','CompleteRegistration');
    }
}

export function fireSignupEvent() {
    /* Facebook */
    if (window.fbq) {
        window.fbq('track','Lead');
    }
}

function createGTag() {
    if (!_gtag) {
        window.dataLayer = window.dataLayer || [];
        _gtag = function () {
            window.dataLayer.push(arguments)
        }
    }
    return _gtag
}