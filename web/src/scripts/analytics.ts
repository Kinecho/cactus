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
// import {init as startBranchSDK} from "@web/branch-sdk";
import "branch-sdk";
import {getAppType} from "@web/DeviceUtil";

let branchConfigured = false;
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
let authLoaded = false;
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
    configureBranch().then(() => {
        getAuth().onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                logger.log("User has logged in, removing any tracking/referral info");
            }
            authLoaded = true;

        });
    }).catch(error => {
        logger.error("Something went wrong configuring branch", error);
    });

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

async function configureBranch(): Promise<void> {
    return new Promise(resolve => {
        if (branchConfigured) {
            resolve();
            return;
        }
        if (window.branch) {
            window.branch.init(Config.branchLiveKey, (error: any, data: any) => {
                if (error) {
                    logger.error("Failed to initialize Branch", error);
                }
                logger.info("Branch init data", JSON.stringify(data, null, 2));
                const refParam = data?.data_parsed?.ref || undefined;
                if (refParam && !StorageService.getString(LocalStorageKey.referredByEmail)) {
                    logger.info("Setting the referredByEmail via Branch Params to: ", refParam);
                    StorageService.saveString(LocalStorageKey.referredByEmail, refParam)
                }
                resolve();
                branchConfigured = true;
                return;
            });
        } else {
            logger.error("No Branch instance was found on the window");
            resolve();
            return;
        }
    })
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

        window.branch?.setIdentity?.(user.uid, (error: any, data: any) => {
            if (error) {
                logger.error("Failed to set user identity for branch user", error);
            }
            logger.info("Set branch identity", data);
        });

    } else {
        setUserId(undefined);
        Sentry.setUser(null);
        if (authLoaded) {
            window.branch?.logout?.()
        }
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

        // if (window.branch) {
        //     await configureBranch();
        //     logger.info("Sending COMPLETE_REGISTRATION event to Branch");
        //     const customData = {app: getAppType(), email: options.email, userId: options.userId};
        //     window.branch.logEvent(
        //         "COMPLETE_REGISTRATION",
        //         customData,
        //         // content_items,
        //         // customer_event_alias,
        //         function (err: any) {
        //             if (err) {
        //                 logger.error("Failed to log branch event", err);
        //             }
        //             resolve()
        //         }
        //     );
        // } else {
        //     //no branch is available, resolve
        //     resolve()
        // }
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
        // if (window.branch) {
        //     await configureBranch();
        //     logger.info("Sending LEAD event to branch");
        //     const customData = {app: getAppType()};
        //     window.branch.logEvent(
        //         "LEAD",
        //         customData,
        //         // content_items,
        //         // customer_event_alias,
        //         function (err: any) {
        //             if (err) {
        //                 logger.error("Failed to log branch event", err);
        //             }
        //             resolve();
        //         }
        //     );
        // } else {
        //     logger.info("No branch object found on window. Can not fire Lead event");
        //     resolve();
        // }
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