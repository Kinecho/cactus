import {DateTime} from "luxon";

export enum SubscriptionTier {
    BASIC = "BASIC",
    PLUS = "PLUS"
}

export function subscriptionTierDisplayName(tier?: SubscriptionTier, isTrial: boolean = false): string | undefined {
    if (isTrial) {
        return "Trial";
    }

    if (!tier) {
        return undefined;
    }
    switch (tier) {
        case SubscriptionTier.BASIC:
            return "Basic";
        case SubscriptionTier.PLUS:
            return "Plus"
    }
}

export interface MemberSubscription {
    tier: SubscriptionTier,
    trial?: {
        startedAt: Date,
        endsAt: Date,
        activatedAt?: Date
    }
}

export const DEFAULT_TRIAL_DAYS = 7;

export function getDefaultSubscription(trialDays: number = DEFAULT_TRIAL_DAYS): MemberSubscription {
    const startDate = new Date();
    const endDate = DateTime.fromJSDate(startDate).plus({days: trialDays}).toJSDate();
    return {
        tier: SubscriptionTier.PLUS,
        trial: {
            startedAt: startDate,
            endsAt: endDate,
            activatedAt: undefined,
        }
    }
}

export function isInTrial(subscription?: MemberSubscription): boolean {
    if (!subscription || !subscription.trial) {
        return false
    }
    if (subscription.tier === SubscriptionTier.BASIC) {
        return false;
    }
    return !subscription.trial?.activatedAt && subscription.trial?.endsAt.getTime() > Date.now();
}

export function trialEnded(subscription?: MemberSubscription): boolean {
    if (!subscription?.trial) {
        return false
    }
    return !subscription?.trial?.activatedAt && subscription?.trial?.endsAt.getTime() < Date.now();
}