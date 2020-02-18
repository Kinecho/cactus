import {DateTime} from "luxon";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
import CopyService from "@shared/copy/CopyService";

export const SubscriptionTierSortValue: { [tier in SubscriptionTier]: number } = {
    [SubscriptionTier.BASIC]: 0,
    [SubscriptionTier.PLUS]: 1,
    [SubscriptionTier.PREMIUM]: 2,
};


export const PremiumSubscriptionTiers = [SubscriptionTier.PLUS];

export function subscriptionTierDisplayName(tier?: SubscriptionTier, isTrial: boolean = false): string | undefined {
    const copy = CopyService.getSharedInstance().copy;
    if (isTrial) {
        return copy.common.TRIAL;
    }

    if (!tier) {
        return undefined;
    }
    switch (tier) {
        case SubscriptionTier.BASIC:
            return copy.checkout.TIER_BASIC;
        case SubscriptionTier.PLUS:
            return copy.checkout.TIER_PLUS;
        case SubscriptionTier.PREMIUM:
            return copy.checkout.TIER_PREMIUM;
    }
}

export interface SubscriptionTrial {
    startedAt: Date,
    endsAt: Date,
    activatedAt?: Date
}

export interface MemberSubscription {
    tier: SubscriptionTier,
    trial?: SubscriptionTrial
}

export const DEFAULT_TRIAL_DAYS = 7;

export function getDefaultSubscription(trialDays: number = DEFAULT_TRIAL_DAYS): MemberSubscription {
    return {
        tier: SubscriptionTier.PLUS,
        trial: getDefaultTrial(trialDays)
    }
}


export function getDefaultTrial(trialDays: number = DEFAULT_TRIAL_DAYS): SubscriptionTrial {
    const startDate = new Date();
    const endDate = DateTime.fromJSDate(startDate).plus({days: trialDays}).toJSDate();
    return {
        startedAt: startDate,
        endsAt: endDate,
        activatedAt: undefined,
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