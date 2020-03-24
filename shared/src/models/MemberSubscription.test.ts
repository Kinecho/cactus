import {
    MemberSubscription,
    OptInTrial,
    needsTrialExpiration,
    isOptInTrialing
} from "@shared/models/MemberSubscription";
import {DateTime} from "luxon";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";

describe("trialEnded tests", () => {
    test("Trial ended", () => {
        const trial: OptInTrial = {
            startedAt: DateTime.local().minus({days: 7}).toJSDate(),
            endsAt: DateTime.local().minus({days: 1}).toJSDate()
        };
        const subscription = {trial, tier: SubscriptionTier.PLUS};
        expect(needsTrialExpiration(subscription)).toBeTruthy();
    });

    test("Trial activated", () => {
        const trial: OptInTrial = {
            startedAt: DateTime.local().minus({days: 7}).toJSDate(),
            endsAt: DateTime.local().minus({days: 1}).toJSDate(),
            activatedAt: DateTime.local().minus({days: 2}).toJSDate()
        };
        const subscription = {trial, tier: SubscriptionTier.PLUS};
        expect(needsTrialExpiration(subscription)).toBeFalsy();
    });

    test("Trial not ended", () => {
        const trial: OptInTrial = {
            startedAt: DateTime.local().minus({days: 7}).toJSDate(),
            endsAt: DateTime.local().plus({days: 1}).toJSDate()
        };
        const subscription = {trial, tier: SubscriptionTier.PLUS};
        expect(needsTrialExpiration(subscription)).toBeFalsy();
    });

    test("tier is basic, trial has ended", () => {
        const trial: OptInTrial = {
            startedAt: DateTime.local().minus({days: 7}).toJSDate(),
            endsAt: DateTime.local().minus({days: 1}).toJSDate()
        };
        const subscription = {trial, tier: SubscriptionTier.BASIC};
        expect(needsTrialExpiration(subscription)).toBeFalsy();
    });

    test("tier is undefined, trial has ended", () => {
        const trial: OptInTrial = {
            startedAt: DateTime.local().minus({days: 7}).toJSDate(),
            endsAt: DateTime.local().minus({days: 1}).toJSDate()
        };
        const subscription = {trial} as MemberSubscription;
        expect(needsTrialExpiration(subscription)).toBeFalsy();
    });

    test("no trial exists, is NOT opt in trialing", () => {
        expect(isOptInTrialing(undefined)).toBeFalsy()
    })
});
