import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";

export interface GapAnalysisOnboardingSettings {
    elementPrompts: {
        energyEntryId: string
        experienceEntryId: string
        relationshipsEntryId: string
        emotionsEntryId: string
        meaningEntryId: string
    }
}

export default class AppSettings extends FlamelinkModel {
    static getSchema(): SchemaName {
        return SchemaName.appSettings;
    }

    schema = SchemaName.appSettings;

    dataExportEnabledTiers: SubscriptionTier[] = [];

    gapAnalysisOnboarding!: GapAnalysisOnboardingSettings;

    constructor(data?: Partial<AppSettings>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}