import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";
import { CactusElement } from "@shared/models/CactusElement";

export interface GapAnalysisOnboardingSettings {
    elementPrompts: {
        energyEntryId: string
        experienceEntryId: string
        relationshipsEntryId: string
        emotionsEntryId: string
        meaningEntryId: string
    }
}

export interface JournalSettings {
    enableAllSentPromptsForTiers: SubscriptionTier[]
}

const defaultJournalSettings = (): JournalSettings => ({
    enableAllSentPromptsForTiers: []
})

export default class AppSettings extends FlamelinkModel {
    static getSchema(): SchemaName {
        return SchemaName.appSettings;
    }

    schema = SchemaName.appSettings;
    dataExportEnabledTiers: SubscriptionTier[] = [];
    gapAnalysisOnboarding!: GapAnalysisOnboardingSettings;
    onboarding!: {
        promptEntryId1: string,
        promptEntryId2: string,
    }

    magicCoreValuesOnboarding!: {
        promptEntryId1: string,
    }

    journal: JournalSettings = defaultJournalSettings();

    constructor(data?: Partial<AppSettings>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }

    onlyShowCompletedSentPromptsForTier(tier?: SubscriptionTier): boolean {
        return !this.journal.enableAllSentPromptsForTiers.includes(tier ?? SubscriptionTier.BASIC)
    }

    getElementOnboardingPromptEntryId(element: CactusElement): string | undefined {
        let entryId: string | undefined;

        switch (element) {
            case CactusElement.energy:
                entryId = this.gapAnalysisOnboarding?.elementPrompts?.energyEntryId;
                break;
            case CactusElement.experience:
                entryId = this.gapAnalysisOnboarding?.elementPrompts?.experienceEntryId;
                break;
            case CactusElement.relationships:
                entryId = this.gapAnalysisOnboarding?.elementPrompts?.relationshipsEntryId;
                break;
            case CactusElement.emotions:
                entryId = this.gapAnalysisOnboarding?.elementPrompts?.emotionsEntryId;
                break;
            case CactusElement.meaning:
                entryId = this.gapAnalysisOnboarding?.elementPrompts?.meaningEntryId;
                break;
        }

        return entryId;
    }
}