import {MergeFields} from "@shared/mailchimp/models/ListMember";
import {SegmentCondition, SegmentMatchType} from "@shared/mailchimp/models/CreateCampaignRequest";

export enum EventType {
    unsubscribe = "unsubscribe",
    subscribe = "subscribe",
    profile = "profile",
    upemail = "upemail",
    cleaned = "cleaned",
    campaign = "campaign",
}

export enum CampaignType {
    regular = "regular",
    plaintext = "plaintext",
    absplit = "absplit",
    rss = "rss",
    variate = "variate",
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

export enum CampaignStatus {
    save = "save",
    paused = "paused",
    schedule ="schedule",
    sending = "sending",
    sent = "sent"
}

export interface CampaignReportSummary {
    opens: number,
    unique_opens: number,
    open_rate: number,
    clicks: number,
    subscriber_clicks: number,
    click_rate: number,
}

export interface Campaign {
    emails_sent: number,
    send_time: string,
    type: string,
    parent_campaign_id: string,
    id: string,
    web_id: string,
    archive_url: string,
    status: CampaignStatus,
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
    report_summary: CampaignReportSummary;
}

export interface MailchimpLink {
    rel: string,
    href: string,
    method: string,
    targetSchema: string,
    schema: string,
}

export interface ListResponse {
    total_items: number,
    _links: MailchimpLink[],
}

export enum SegmentType {
    saved = "saved",
    static = "static",
    fuzzy = "fuzzy"
}

type ISODate = string;

export interface Segment {
    id: number,
    name: string,
    member_count: number,
    type: SegmentType,
    created_at: ISODate,
    updated_at: ISODate,
    options: {
        match: SegmentMatchType,
        conditions: SegmentCondition[],
    },
    list_id: string,
    _links: MailchimpLink[]

}

export interface SegmentListResponse extends ListResponse{
    segments: Segment[],
    list_id: string,
}

export enum TemplateType {
    user = "user",
    base = "base",
    gallery = "gallery"
}

/**
 * Email Template
 * (@Link https://developer.mailchimp.com/documentation/mailchimp/reference/templates/#read-get_templates)
 */
export interface Template {
    id: number,
    type: TemplateType,
    name: string,
    drag_and_drop: boolean,
    responsive: boolean,
    category: string,
    date_created: ISODate,
    date_edited: ISODate,
    created_by: string,
    edited_by: string,
    active: boolean,
    folder_id: string,
    thumbnail?: string, //url of the image
    share_url: string,
    _links: MailchimpLink[],
}

export enum TemplateSortField {
    date_created = "date_created",
    name = "name",
}

export interface TemplateListResponse extends ListResponse {
    templates: Template[],

}

enum AutomationStatus {
    save = "save",
    paused = "paused",
    sending = "sending",
}

export interface AutomationCampaignSettings {
    title: string;
    from_name: string;
    reply_to: string;
    use_conversation: boolean;
    to_name: string;
    authenticate: boolean;
    auto_footer: boolean;
    inline_css: boolean;
}

export interface AutomationTrackingOptions {
    opens: boolean;
    html_clicks: boolean;
    text_clicks: boolean;
    goal_tracking: boolean;
    ecomm360: boolean;
    google_analytics: string;
    clicktale: string;
}

export enum AutomationSendHourType {
    send_asap = "send_asap",
    send_between = "send_between",
    send_at = "send_at",
}

export interface AutomationTrigger {
    workflow_type: string;
    workflow_title: string;
    //then there are a ton of options here
    // see https://developer.mailchimp.com/documentation/mailchimp/reference/automations/#read-get_automations
    trigger_on_import: boolean;
    send_immediately: boolean;
    workflow_emails_count: number;
    runtime: {
        days: any[],
        hours: {
            type: AutomationSendHourType;
            send_asap?: boolean;
            send_between?: {
                start: string;
                end: string;
            };
            sent_at?: string;
        }
    }
}

export interface AutomationRecipients {
    list_id: string;
    list_is_active: string;
    list_name: string;
    segment_opts: {
        saved_segment_id: number;
        match: SegmentMatchType,
        conditions: SegmentCondition[]
    };
    store_id: string;
}

export interface Automation {
    id: string;
    create_time: ISODate;
    start_time: ISODate;
    status: AutomationStatus;
    emails_sent: number,
    recipients: AutomationRecipients;
    settings: AutomationCampaignSettings;
    tracking: AutomationTrackingOptions;
    trigger_settings: AutomationTrigger;
    report_summary: CampaignReportSummary;
    _links: MailchimpLink[];
}

export interface AutomationListResponse extends ListResponse {
    automations: Automation[],
}

export interface AutomationWorkflow {
    id: string;
    create_time: ISODate;
    start_time: ISODate;
    status: AutomationStatus;
    emails_sent: number;
    recipients: AutomationRecipients;
    settings: AutomationCampaignSettings;
    tracking: AutomationTrackingOptions;
    trigger_settings: AutomationTrigger;
    report_summary: CampaignReportSummary;
}