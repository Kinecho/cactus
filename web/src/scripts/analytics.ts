import {Config} from './config'
import {QueryParam} from "@shared/util/queryParams";
import {getQueryParam} from "@web/util";
import Vue from 'vue'
import * as Integrations from '@sentry/integrations';
import * as Sentry from '@sentry/browser';
import {User} from "firebase/app"
import {getAuth} from "@web/firebase";
import StorageService, {LocalStorageKey} from "@web/services/StorageService";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger";

const logger = new Logger("Analytics.ts");
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
let isFirstAuthLoad = false;

/**
 * set up the analytics function
 *
 * returns function
 */
export function init() {
    if (hasInit) {
        logger.warn("Analytics already initialized, not reinitializing");
        return;
    }

    getAuth().onAuthStateChanged(user => {
        setUser(user);
        if (user) {
            logger.log("User has logged in, removing any tracking/referral info");
        }
        isFirstAuthLoad = true;

    });

    const sentryIntegrations: any[] = []; //using any because it doesn't look like sentry's Integration interface is exported
    if (!Config.isDev) {
        sentryIntegrations.push(new Integrations.Vue({Vue, attachProps: true}));
        Sentry.init({
            dsn: Config.sentry.dsn,
            release: Config.version,
            environment: Config.env,
            integrations: sentryIntegrations,
            beforeSend(event: Sentry.Event): Promise<Sentry.Event | null> | Sentry.Event | null {
                const email = CactusMemberService.sharedInstance.currentMember?.email;
                if (email) {
                    const tags = event.tags || {};
                    tags["user.email"] = email;
                    event.tags = tags;
                }

                return event
            }
        });
    }

    logger.log("version is ", Config.version);

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
        logger.error("Failed to clear tracking data", e);
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

export async function fireConfirmedSignupEvent(options: { email?: string, userId?: string }): Promise<void> {
    return new Promise(async resolve => {

        logger.debug("Firing confirmed signup event");
        /* Facebook */
        if (window.fbq) {
            logger.debug("Sending CompleteRegistration event to facebook");
            window.fbq('track', 'CompleteRegistration', {
                value: 0.00,
                currency: 'USD'
            });
        }
        resolve();
    })
}

export async function fireSignupEvent() {
    return new Promise(async resolve => {
        logger.info("Fired 'Lead' Event");
        /* Facebook */
        if (window.fbq) {
            logger.debug("Sending Lead event to Facebook");
            window.fbq('track', 'Lead');
        }
        resolve();
    })
}

export async function fireStartTrialEvent(options: { value?: number, predicted_ltv?: number }) {
    return new Promise(async resolve => {
        logger.info("Fired 'StartTrial' Event");
        const { value, predicted_ltv } = options;
        
        /* Facebook */
        if (window.fbq) {
            logger.debug("Sending StartTrial event to Facebook");
            window.fbq('track', 'StartTrial', {
                value: (value?.toString() || '0.00'), 
                currency: 'USD', 
                predicted_ltv: (predicted_ltv?.toString() || value?.toString() || '0.00')
            });
        }
        resolve();
    })
}

export function socialSharingEvent(options: { type: "open" | "close" | "change", network?: string, url?: string }) {
    gtag('event', options.type, {
        event_category: "social_share",
        event_label: options.network
    });
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

export function fireRevealInsightEvent() {
    gtag('event', 'revealed_insight', {
        event_category: "prompt_content",
        event_label: "word_chart"
    });
}