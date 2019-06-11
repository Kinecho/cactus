import {MergeFields} from "@shared/mailchimp/models/ListMember";

export enum EventType {
    unsubscribe = "unsubscribe",
    subscribe = "subscribe",
    profile = "profile",
    upemail = "upemail",
    cleaned = "cleaned",
    campaign = "campaign",
}

export enum UnsubscribeAction {
    unsub = "unsub",
    delete = "delete"
}

export enum UnsubscribeReason {
    manual = "manual",
    abuse = "abuse"
}

export enum CleanedReason {
    hard = "hard",
    abuse = "abuse",
}

export interface WebhookEvent {
    type: EventType,
    fired_at: string,
    data: SubscribeEventData|UnsubscribeEventData|ProfileUpdateEventData|EmailChangeEventData|CleanedEmailEventData|CampaignEventData,
}


export interface SubscribeEventData{
    id: string,
    list_id: string,
    email: string,
    email_type: string,
    merges: MergeFields,
    ip_opt: string,
    ip_signup: string,
}

// An event’s action is either unsub or delete.
// The reason will be manual unless caused by a spam complaint, then it will be abuse.
export interface UnsubscribeEventData {
    id: string,
    list_id: string,
    email: string,
    email_type: string,
    action: UnsubscribeAction,
    reason: UnsubscribeReason,
    merges: MergeFields,
    ip_opt: string,
    campaign_id: string,
}

export interface ProfileUpdateEventData {
    id: string,
    list_id: string,
    email: string,
    email_type: string,
    merges: MergeFields,
    ip_opt: string,
}

// Note that you will always receive a profile
// update at the same time as an email update.
export interface EmailChangeEventData {
    list_id: string,
    new_id: string,
    new_email: string,
    old_email: string,
}

export interface CleanedEmailEventData {
    list_id: string,
    campaign_id: string,
    reason: CleanedReason,
    email: string,
}

export interface CampaignEventData {
    id: string,
    subject: string,
    status: string,
    reason?: string,
    list_id: string,
}

export interface Campaign {
    emails_sent: number,
    send_time: string,
    type: string,
    parent_campaign_id: string,
    id: string,
    web_id: string,
    archive_url: string,
    status: string,
    recipients: {
        list_id: string,
        list_is_active: boolean,
        list_name: string,
        segment_text: string,
        recipient_count: number,
        segment_options: any,
    },
    settings: {
        subject_line: string,
        preview_text: string,
        title: string,
        from_name: string,
        reply_to: string,
        use_conversation: boolean,
        to_name: string,
        template_id: string,
    },
    report_summary: {
        opens: number,
        unique_opens: number,
        open_rate: number,
        clicks: number,
        subscriber_clicks: number,
        click_rate: number,

    }
}