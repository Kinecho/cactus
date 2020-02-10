import {DateTime, Interval} from "luxon";

export enum SubscriptionTier {
    BASIC = "BASIC",
    PLUS = "PLUS"
}

export function subscriptionTierDisplayName(tier: SubscriptionTier): string {
    switch (tier) {
        case SubscriptionTier.BASIC:
            return "Basic";
        case SubscriptionTier.PLUS:
            return "Plus"
    }
}

export interface MemberSubscription {
    tier: SubscriptionTier,
    trial: {
        startedAt: Date,
        endsAt: Date,
        activatedAt?: Date
    }
}

export function createSubscription(trialDays: number = 7): MemberSubscription {
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
    if (!subscription) {
        return false
    }
    return subscription.trial.endsAt.getTime() > Date.now();
}