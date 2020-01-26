import {Config} from './config'
import {QueryParam} from "@shared/util/queryParams";
import {getQueryParam} from "@web/util";
import Vue from 'vue'
import * as Integrations from '@sentry/integrations';
import * as Sentry from '@sentry/browser';
import {User} from "firebase/app"
import {getAuth} from "@web/firebase";
import {LocalStorageKey} from "@web/services/StorageService";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger";
// import {init as startBranchSDK} from "@web/branch-sdk";
import "branch-sdk";
import {getAppType} from "@web/DeviceUtil";

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

    });

    configureBranch();
    const sentryIntegrations = [];
    if (!Config.isDev) {
        sentryIntegrations.push(new Integrations.Vue({Vue, attachProps: true}));
        Sentry.init({
            dsn: Config.sentry.dsn,
            release: Config.version,
            environment: Config.env,
            integrations: sentryIntegrations,
            beforeSend(event: Sentry.Event): Promise<Sentry.Event | null> | Sentry.Event | null {
                const email = CactusMemberService.sharedInstance.getCurrentCactusMember()?.email;
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

function configureBranch() {
    // window.branch.init();
    if (window.branch) {
        window.branch.init(Config.branchLiveKey, (error: any, data: any) => {
            if (error) {
                logger.error("Failed to initialize Branch", error);
            }
            logger.info("Branch init data", data);
        });

    }
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
        window.branch?.setIdentity?.(user.uid, (error: any, data: any) => {
            if (error) {
                logger.error("Failed to set user identity for branch user", error);
            }
            logger.info("Set branch identity", data);
        });
        Sentry.setUser(sentryUser);

    } else {
        setUserId(undefined);
        Sentry.setUser(null);
        window.branch?.logout?.()
    }
}

export async function fireConfirmedSignupEvent(options: { email?: string, userId?: string }): Promise<void> {
    return new Promise(resolve => {


        /* Facebook */
        if (window.fbq) {
            window.fbq('track', 'CompleteRegistration', {
                value: 0.00,
                currency: 'USD'
            });
        }

        if (window.branch) {
            logger.info("Sending COMPLETE_REGISTRATION event to Branch");
            const customData = {app: getAppType(), email: options.email, userId: options.userId};
            window.branch.logEvent(
                "COMPLETE_REGISTRATION",
                customData,
                // content_items,
                // customer_event_alias,
                function (err: any) {
                    if (err) {
                        logger.error("Failed to log branch event", err);
                    }
                    resolve()
                }
            );
        } else {
            //no branch is available, resolve
            resolve()
        }
    })
}

export function fireSignupEvent() {
    /* Facebook */
    if (window.fbq) {
        window.fbq('track', 'Lead');
    }

    if (window.branch) {
        logger.log("Sending LEAD event to branch");
        const customData = {app: getAppType()};
        window.branch.logEvent(
            "LEAD",
            customData,
            // content_items,
            // customer_event_alias,
            function (err: any) {
                if (err) {
                    logger.error("Failed to log branch event", err);
                }
            }
        );
    }
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