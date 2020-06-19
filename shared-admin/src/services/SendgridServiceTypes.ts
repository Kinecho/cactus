export interface MagicLinkEmail {
    email: string,
    link: string,
    displayName?: string,
    sourceApp?: string
}

export interface InvitationEmail {
    toEmail: string,
    fromEmail: string,
    fromName: string | undefined,
    link: string,
    message?: string,
}

export interface FriendRequestEmail {
    toEmail: string,
    fromEmail: string,
    fromName: string | undefined,
    link: string
}

export interface TrialEndingEmail {
    toEmail: string,
    memberId?: string,
    link: string,
    firstName: string | undefined
}

export interface PromptNotificationEmail {
    email: string,
    memberId: string,
    promptContentEntryId: string,
    reflectUrl: string
    mainText: string,
    subjectLine: string,
    firstName?: string,
    isPlus?: boolean,
    previewText?: string,
    inOptOutTrial?: boolean,
    inOptInTrial?: boolean,
    trialDaysLeft?: number,
    showTrialBanner?: boolean,
    trialEndsToday?: boolean,
    footerText?: string,
}