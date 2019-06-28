import ListMember, {MergeFields, Tag} from "@shared/mailchimp/models/ListMember";
import {CampaignTracking, SegmentCondition, SegmentMatchType} from "@shared/mailchimp/models/CreateCampaignRequest";

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
    data: SubscribeEventData | UnsubscribeEventData | ProfileUpdateEventData | EmailChangeEventData | CleanedEmailEventData | CampaignEventData,
}


export interface SubscribeEventData {
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
    schedule = "schedule",
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

export interface CampaignSocialCard {
    image_url?: string,
    description?: string,
    title?: string,
}

export interface CampaignSearchResult {
    campaign: Campaign;
    snippet: string
}

export interface CampaignSearchResultListResponse extends ListResponse {
    results: [CampaignSearchResult]
}

export interface CampaignSettings {
    subject_line: string,
    preview_text: string,
    title: string,
    from_name: string,
    reply_to: string,
    authenticate: boolean,
    auto_footer: boolean,
    inline_css: boolean,
    auto_tweet: boolean,
    auto_fb_post: string[],
    fb_comments: boolean,
    drag_and_drop: boolean
    use_conversation: boolean,
    to_name: string,
    template_id: string,
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
        segment_opts: any,
    },
    settings: CampaignSettings,
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

export interface SegmentListResponse extends ListResponse {
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

export interface AutomationEmailRecipients {
    list_id: string;
    list_is_active: string;
    list_name: string;
    segment_text: string,
    recipient_count: number,
    segment_opts: {
        saved_segment_id: number;
        match: SegmentMatchType,
        conditions: SegmentCondition[]
    };
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

export enum AutomationDelayType {
    now = "now",
    day = "day",
    hour = "hour",
    week = "week",
}

export enum AutomationDelayDirection {
    before = "before",
    after = "after"
}

export enum AutomationDelayAction {
    previous_campaign_sent = "previous_campaign_sent",
    previous_campaign_opened = "previous_campaign_opened",
    previous_campaign_not_opened = "previous_campaign_not_opened",
    previous_campaign_clicked_any = "previous_campaign_clicked_any",
    previous_campaign_not_clicked_any = "previous_campaign_not_clicked_any",
    previous_campaign_specific_clicked = "previous_campaign_specific_clicked",
    ecomm_bought_any = "ecomm_bought_any",
    ecomm_bought_product = "ecomm_bought_product",
    ecomm_bought_category = "ecomm_bought_category",
    ecomm_not_bought_any = "ecomm_not_bought_any",
    ecomm_abandoned_cart = "ecomm_abandoned_cart",
    campaign_sent = "campaign_sent",
    opened_email = "opened_email",
    not_opened_email = "not_opened_email",
    clicked_email = "clicked_email",
    not_clicked_email = "not_clicked_email",
    campaign_specific_clicked = "campaign_specific_clicked",
    manual = "manual",
    signup = "signup",
    merge_changed = "merge_changed",
    group_add = "group_add",
    group_remove = "group_remove",
    mandrill_sent = "mandrill_sent",
    mandrill_opened = "mandrill_opened",
    mandrill_clicked = "mandrill_clicked",
    mandrill_any = "mandrill_any",
    api = "api",
    goal = "goal",
    annual = "annual",
    birthday = "birthday",
    date = "date",
    date_added = "date_added",
    tag_add = "tag_add",
}

export enum AutomationCampaignContentType {
    drag_and_drop = "drag_and_drop",
    html = "html",
    url = "url",
}


export interface AutomationEmailCampaignSettings {
    subject_line: string,
    preview_text: string,
    title: string,
    from_name: string,
    reply_to: string,
    authenticate: boolean,
    auto_footer: boolean,
    inline_css: boolean,
    auto_tweet: boolean,
    auto_fb_post: string[],
    fb_comments: boolean,
    drag_and_drop: boolean
    // use_conversation: boolean,
    to_name: string,
    template_id: string,
}

export interface AutomationEmail {
    id: string,
    web_id: string,
    workflow_id: string,
    position: number,
    delay: {
        amount: number,
        type: AutomationDelayType,
        direction: AutomationDelayDirection,
        action:  AutomationDelayAction,
        action_description: string,
        full_description: string,
    },
    create_time: ISODate,
    start_time: ISODate,
    archive_url: string,
    status: CampaignStatus,
    emails_sent: number,
    send_time: ISODate,
    content_type: AutomationCampaignContentType,
    needs_block_refresh: boolean,
    has_logo_merge_tag: boolean,
    recipients: AutomationEmailRecipients,
    settings: AutomationEmailCampaignSettings,
    tracking: CampaignTracking,
    social_card: CampaignSocialCard,
    trigger_settings: AutomationTrigger,
    report_summary:  CampaignReportSummary,
}

export interface AutomationListResponse extends ListResponse {
    automations: Automation[],
}

export interface AutomationEmailListResponse extends ListResponse {
    emails: AutomationEmail[]
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

export enum AudienceVisibility {
    pub = "pub",
    prv = "prv",
}

export interface Audience {
    id: string,
    web_id: number,
    name: string,
    campaign_defaults: {
        from_name: string;
        from_email: string;
        subject: string;
        language: string;
    }
    contact: {
        company: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone: string;
    }
    permission_reminder: string;
    use_archive_bar: boolean;
    notify_on_subscribe: string;
    notify_on_unsubscribe: string;
    date_created: ISODate;
    list_rating: number;
    email_type_option: boolean;
    subscribe_url_short: string;
    subscribe_url_long: string;
    beamer_address: string;
    visibility: AudienceVisibility;
    double_optin: boolean;
    has_welcome: boolean;
    marketing_permissions: boolean;
    modules: any[];
    stats: {
        member_count: number;
        total_contacts: number;
        unsubscribe_count: number
        cleaned_count: number
        member_count_since_send: number;
        unsubscribe_count_since_send: number
        cleaned_count_since_send: number
        campaign_count: number
        campaign_last_sent: ISODate
        merge_field_count: number;
        avg_sub_rate: number
        avg_unsub_rate: number
        target_sub_rate: number
        open_rate: number
        click_rate: number
        last_sub_date: ISODate
        last_unsub_date: ISODate
    }
}

export interface AudienceListResponse extends ListResponse {
    lists: Audience[],
    constraints: {
        may_create: boolean,
        max_instances: number;
        current_total_instances: number;
    }
}

export enum SendChecklistItemType {
    success = "success",
    warning = "warning",
    error = "error"
}

export interface SendChecklistItem {
    type: SendChecklistItemType;
    id: number;
    heading: string;
    details: string;
}

export interface SendChecklist {
    is_ready: boolean;
    items: SendChecklistItem[];
    _links?: MailchimpLink[];
}

export interface CampaignScheduleBody {
    schedule_time: ISODate;
    timewarp?: boolean;
    batch_delivery?: {
        batch_delay: number;
        batch_count: number;
    };
}

export enum CampaignSortField {
    create_time = "create_time",
    send_time = "send_time",
}

export enum SortDirection {
    ASC = "ASC",
    DESC = "DESC",
}

export interface PaginationParameters {
    count?: number,
    offset?: number
}

export const defaultPageSize = 30;
export const defaultOffset = 0;


export const DEFAULT_PAGINATION: PaginationParameters = {
    count: defaultPageSize,
    offset: defaultOffset,
};

export interface SearchMembersOptions {
    list_id?: string;
    exclude_fields?: string[],
    fields?: string[],
    query: string,
}

export function getSearchMemberOptionsDefaults(): SearchMembersOptions {
    return {
        exclude_fields: ["exact_matches.members._links", "full_search.members._links", "_links"],
        query: "",
    }
}

export interface SearchMembersResult {
    exact_matches: {
        members: ListMember[];
        total_items: number;
    }[],
    full_search: {
        members: ListMember[];
        total_items: number;
    }
}

export interface GetCampaignsOptions {
    params?: {
        sort_field?: CampaignSortField,
        sort_dir?: SortDirection,
        list_id?: string,
        folder_id?: string,
        since_create_time?: ISODate,
        before_create_time?: ISODate,
        since_send_time?: ISODate,
        before_send_time?: ISODate,
        status?: CampaignStatus,
        type?: CampaignType,
        exclude_fields?: string[],
        fields?: string[],
    },

    pagination?: PaginationParameters

}

export function getDefaultCampaignFetchOptions(): GetCampaignsOptions {
    return {
        params: {
            sort_field: CampaignSortField.create_time,
            sort_dir: SortDirection.DESC,
            exclude_fields: ["campaign._links"]
        },
        pagination: DEFAULT_PAGINATION
    };
}

export interface CampaignListResponse extends ListResponse {
    campaigns: Campaign[]
}


export interface UpdateMergeFieldRequest {
    email: string,
    mergeFields: MergeFields
}

export interface UpdateTagsRequest {
    email: string,
    tags: Tag[]
}
