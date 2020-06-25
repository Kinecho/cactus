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
    isLastEmail?: boolean,
}

export enum SendgridEventType {
    processed = "processed",
    deferred = "deferred",
    delivered = "delivered",
    open = "open",
    clicked = "click",
    bounce = "bounce",
    dropped = "dropped",
    spamreport = "spamreport",
    unsubscribe = "unsubscribe",
    group_unsubscribe = "group_unsubscribe",
    group_resubscribe = "group_resubscribe",
}

export function isAdvancedSubscriptionManagementEvent(event: SendgridWebhookEvent): event is AdvancedSubscriptionManagementEvent {
    return !!(event as AdvancedSubscriptionManagementEvent).asm_group_id;
}

export interface SendgridWebhookEvent {
    email: string,
    timestamp: number, //in seconds from epoch
    "smtp-id": string,
    event: SendgridEventType,
    category?: string[],
    sg_event_id: string,
    sg_message_id: string,
}

export interface AdvancedSubscriptionManagementEvent extends SendgridWebhookEvent {
    asm_group_id: number,
}

export interface WebhookEventResult {
    event: SendgridEventType,
    success: boolean,
}