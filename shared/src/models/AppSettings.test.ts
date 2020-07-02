import AppSettings from "@shared/models/AppSettings"
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";

describe("Journal Settings", () => {
    test("Only show completed when using default settings", () => {
        const settings = new AppSettings();
        expect(settings.onlyShowCompletedSentPromptsForTier(SubscriptionTier.BASIC)).toBeTruthy();
        expect(settings.onlyShowCompletedSentPromptsForTier(SubscriptionTier.PLUS)).toBeTruthy();
        expect(settings.onlyShowCompletedSentPromptsForTier(SubscriptionTier.PREMIUM)).toBeTruthy();
    })

    test("Show all prompts when using PLUS is enabled", () => {
        const settings = new AppSettings();
        settings.journal.enableAllSentPromptsForTiers = [SubscriptionTier.PLUS]
        expect(settings.onlyShowCompletedSentPromptsForTier(SubscriptionTier.BASIC)).toBeTruthy();
        expect(settings.onlyShowCompletedSentPromptsForTier(SubscriptionTier.PLUS)).toBeFalsy();
        expect(settings.onlyShowCompletedSentPromptsForTier(SubscriptionTier.PREMIUM)).toBeTruthy();
    })
})