export interface SendgridPromptNotification {
    previewText?: string;
    isPlus: boolean;
    inOptOutTrial: boolean;
    inOptInTrial: boolean;
    trialDaysLeft?: number;
    showTrialBanner: boolean;
    trialEndsToday: boolean;
    mainText: string;
}