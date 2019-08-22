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

// window.dataLayer = window.dataLayer || {};

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
    }


    getAuth().onAuthStateChanged(user => {
        setUser(user);
        if (user) {
            console.log("User has logged in, removing any tracking/referral info");
        }

    });

    const sentryIntegrations = [];
    if (!Config.isDev) {
        sentryIntegrations.push(new Integrations.Vue({Vue, attachProps: true}))
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
    gtag('config', 'GA_MEASUREMENT_ID', {
        'user_id': userId,
        'custom_map': {'dimension1': userId}
    });
}

export function setUser(user?: User | null) {
    if (user) {
        const email = user.email;
        setUserId(user.uid);

        const sentryUser: Sentry.User = {};
        if (email) {
            sentryUser.email = email;
        }
        if (user.uid) {
            sentryUser.id = user.uid;
        }

        Sentry.setUser(sentryUser);

        if (window.FS) {
            // TODO: Add your own custom user variables here, details at
            // http://help.fullstory.com/develop-js/setuservars
            window.FS.identify(user.uid, {
                email: user.email,
                displayName: user.displayName
            })
        }
    } else {
        setUserId(undefined);
        Sentry.setUser(null);
        if (window.FS) {
            window.FS.identify(false);
        }

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


// tslint:disable
// @ts-ignore:
export function startFullstory() {

    if (!Config.fullStoryTeamId) {
        return;
    }

    // console.log("Fullstory is enabled. Starting FullStory");

    const _fs_host = 'fullstory.com';
    // noinspection UseOfBracketNotationInspection
    window['_fs_debug'] = false;
    // noinspection UseOfBracketNotationInspection
    window['_fs_host'] = _fs_host;
    // noinspection UseOfBracketNotationInspection
    window['_fs_org'] = Config.fullStoryTeamId;
    // noinspection UseOfBracketNotationInspection
    window['_fs_namespace'] = 'FS';

    // tslint:disable
    (function (m, n, e, t, l, o, g, y) {
        if (e in m) {
            if (m.console && m.console.log) {
                m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');
            }
            return;
        }
        // @ts-ignore
        g = m[e] = function (a, b, s) {
            // @ts-ignore
            g.q ? g.q.push([a, b, s]) : g._api(a, b, s);
        };
        // @ts-ignore
        g.q = [];
        // @ts-ignore
        o = n.createElement(t);
        // @ts-ignore
        o.async = 1;
        // @ts-ignore
        o.crossOrigin = 'anonymous';
        // @ts-ignore
        o.src = 'https://' + _fs_host + '/s/fs.js';
        // @ts-ignore
        y = n.getElementsByTagName(t)[0];
        // @ts-ignore
        y.parentNode.insertBefore(o, y);
        // @ts-ignore
        g.identify = function (i, v, s) {
            // @ts-ignore
            g(l, {uid: i}, s);
            // @ts-ignore
            if (v) g(l, v, s)
        };
        // @ts-ignore
        g.setUserVars = function (v, s) {
            // @ts-ignore
            g(l, v, s)
        };
        // @ts-ignore
        g.event = function (i, v, s) {
            // @ts-ignore
            g('event', {n: i, p: v}, s)
        };
        // @ts-ignore
        g.shutdown = function () {
            // @ts-ignore
            g("rec", !1)
        };
        // @ts-ignore
        g.restart = function () {
            // @ts-ignore
            g("rec", !0)
        };
        // @ts-ignore
        g.consent = function (a) {
            // @ts-ignore
            g("consent", !arguments.length || a)
        };
        // @ts-ignore
        g.identifyAccount = function (i, v) {
            // @ts-ignore
            o = 'account';
            v = v || {};
            v.acctId = i;
            // @ts-ignore
            g(o, v)
        };
        // @ts-ignore
        g.clearUserCookie = function () {
        };
        // @ts-ignore
    })(window, document, window['_fs_namespace'], 'script', 'user');
}

// tslint:enable