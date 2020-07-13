import { Config } from './config'
import { QueryParam } from "@shared/util/queryParams";
import { getQueryParam } from "@web/util";
import Vue from 'vue'
import * as Integrations from '@sentry/integrations';
import * as Sentry from '@sentry/browser';
import { User } from "firebase/app"
import { firebaseAnalytics, getAuth } from "@web/firebase";
import { LocalStorageKey } from "@web/services/StorageService";
import CactusMemberService from "@web/services/CactusMemberService";
import Logger from "@shared/Logger";
import { isAndroidApp } from "@web/DeviceUtil";
import { Route } from "vue-router";
import { CactusElement } from "@shared/models/CactusElement";
import { isNumber } from "@shared/util/ObjectUtil";
import { ScreenName } from "@components/gapanalysis/GapAssessmentTypes";
import { BillingPeriod } from "@shared/models/SubscriptionProduct";
import PromotionalOffer, { OfferDetails } from "@shared/models/PromotionalOffer";

const logger = new Logger("Analytics.ts");

let firstRouteFired = false;

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
        isFirstAuthLoad = true;

    });

    const sentryIntegrations: any[] = []; //using any because it doesn't look like sentry's Integration interface is exported
    if (!Config.isDev) {
        sentryIntegrations.push(new Integrations.Vue({ Vue, attachProps: true }));
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

    createGTag();
    gtag('js', new Date());
    gtag('config', Config.googleAnalyticsID, { 'optimize_id': Config.googleOptimizeID });

    const mailchimpUserId = getQueryParam(QueryParam.MAILCHIMP_EMAIL_ID);
    if (mailchimpUserId) {
        setUserId(`mcuid_${ mailchimpUserId }`);
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
    gtag('set', { 'user_id': userId }); // Set the user ID using signed-in user_id.}
    gtag('config', Config.googleAnalyticsID, {
        'user_id': userId,
        'custom_map': { 'dimension1': userId }
    });
    firebaseAnalytics().setUserId(userId ?? '');
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

export async function fireConfirmedSignupEvent(options: { email?: string, userId?: string, method?: string }): Promise<void> {
    return new Promise(async resolve => {

        firebaseAnalytics().logEvent("sign_up", { method: options.method })

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

export function fireLoginEvent(options: { method?: string }) {
    firebaseAnalytics().logEvent("login", { method: options.method });
}

export async function fireSignupLeadEvent() {
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

/**
 * Value is in price in dollars
 * @param {{value?: number, predicted_ltv?: number}} options
 * @return {Promise<unknown>}
 */
export async function fireOptInStartTrialEvent(options: { value?: number, predicted_ltv?: number }) {
    return new Promise(async resolve => {
        logger.info("Fired 'StartTrial' Event");
        const { value, predicted_ltv } = options;

        /* Facebook */
        if (window.fbq) {
            logger.debug("Sending StartTrial event to Facebook");
            window.fbq('track', 'StartTrial', {
                value: (value?.toString() ?? '0.00'),
                currency: 'USD',
                predicted_ltv: (predicted_ltv?.toString() ?? value?.toString() ?? '0.00')
            });
        }
        const dollar = (options.value ?? 0);
        //if web, it means we checked out via stripe.
        if (!isAndroidApp()) {
            //@ts-ignore
            firebaseAnalytics().logEvent("purchase", { value: dollar, currency: 'USD' })
        }

        firebaseAnalytics().logEvent("trial_start", { value: dollar, currency: 'USD' })

        resolve();
    })
}

export function logBeginCheckout(params: { valueDollars: number, subscriptionProductId: string }) {
    // /**
    //  * Old style analytics..
    //  */
    // gtag('event', 'begin_checkout', {
    //     value: params.valueDollars,
    //     items: [params.subscriptionProductId],
    //     currency: 'USD',
    // });

    firebaseAnalytics().logEvent("begin_checkout", {
        value: params.valueDollars,
        currency: 'USD',
        items: [{ item_id: params.subscriptionProductId }]
    })
}

export function logCoreValuesAssessmentStarted() {
    firebaseAnalytics().logEvent("core_values_started");
}

export function logCoreValuesAssessmentProgress(page: number) {
    firebaseAnalytics().logEvent("core_values_progress", { page: page });
}


export function logCoreValuesAssessmentCompleted() {
    firebaseAnalytics().logEvent("core_values_completed");
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

export function logRouteChanged(to: Route): void {
    //Only want to fire subsequent page view events as standard analytics will fire the initial page load.
    if (firstRouteFired) {
        firebaseAnalytics().logEvent("page_view" as never, {
            page_path: to.path,
            page_title: to.name,
            page_location: window.location.href,
            name: to.name
        });
    }
    firstRouteFired = true;
}

export function logGapAnalysisStarted() {
    firebaseAnalytics().logEvent("gap_analysis_started")
}

export function logFocusElementSelected(element: CactusElement | null) {
    firebaseAnalytics().logEvent("focus_element_selected", { element })
}

export function logGapAnalysisCompleted() {
    firebaseAnalytics().logEvent("gap_analysis_completed")
}

export function logGapAnalysisCanceled(screen?: string | null) {
    firebaseAnalytics().logEvent("gap_analysis_canceled", { screen });
}


export function logGapAnalysisScreen(screen: ScreenName, questionId?: number) {
    let params = {};
    if (!isNumber(questionId)) {
        params = { question: questionId };
    }
    firebaseAnalytics().logEvent(`gap_analysis_screen_${ screen }`, params)
}

export function logPresentSubscriptionOffers(options: {
    promotionName?: string,
    creativeName?: string,
    products: {
        subscriptionProductId?: string,
        billingPeriod?: BillingPeriod,
        name?: string
    }[]
}) {
    const items = options.products.map(product => ({
        item_category: product.billingPeriod,
        item_name: product.name,
        item_id: product.subscriptionProductId
    }));

    firebaseAnalytics().logEvent("view_promotion", {
        items,
        promotion_name: options.promotionName,
        creative_name: options.creativeName,
    })
}

export function logOfferViewed(offer: OfferDetails) {
    firebaseAnalytics().logEvent("select_promotion", {
        promotion_name: offer.displayName,
        promotion_id: offer.entryId,
    })
}

export function logOfferApplied(offer: OfferDetails) {
    firebaseAnalytics().logEvent("select_promotion", {
        promotion_name: offer.displayName,
        promotion_id: offer.entryId,
    })
}