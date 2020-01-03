import {CampaignSocialCard, CampaignType, MailchimpLink} from "@shared/mailchimp/models/MailchimpTypes";

export enum SegmentMatchType {
    any = "any",
    all = "all"
}

export enum SegmentOperator {
    //email activity
    open = "open",
    click = "click",
    sent = "sent",
    noopen = "noopen",
    noclick = "noclick",
    nosent = "nosent",

    //automation operators
    started = "started",
    completed = "completed",
    not_started = "not_started",
    not_completed = "not_completed",

    //date operators
    greater = "greater",
    less = "less",
    is = "is",
    not = "not",
    blank = "blank",
    blank_not = "blank_not",

    //conversation
    member = "member",
    notmember = "notmember",

    //string operators
    contains = "contains",
    notcontain = "notcontain",
    starts = "starts",
    ends = "ends",

    //fuzzy
    fuzzy_id = "fuzzy_id",
    fuzzy_not = "fuzzy_not",

    //static segments (now known as tags)
    static_is = "static_is",
    static_not = "static_not",

    tag_is = "static_is",       //custom alias for static
    tag_not = "static_is"       //custom alias for static
}

export enum SegmentField {
    timestamp_opt = "timestamp_opt",
    info_changed = "info_changed",
    ecomm_date = "ecomm_date",
    conversation = "conversation",
    automation = "automation",          //value for this is The web id for the Automation workflow to segment on.
    EMAIL = "EMAIL",
    merge0 = "merge0",
    fuzzy_segment = "fuzzy_segment",
    aim = "aim",                        //value for this is Either the web id value for a specific campaign or ‘any’ to account for subscribers who have or have not interacted with any campaigns.
    static_segment = "static_segment",  //now known as tags
    tags = "static_segment"             //custom alias for static segment


}

export enum SegmentValue {
    date = "date",
    campaign = "campaign",
    last = "last",
}

export enum SegmentConditionType {
    Aim = "Aim",
    Automation = "Automation",
    CampaignPoll = "CampaignPoll",
    Conversation = "Conversation",
    Date = "Date",
    EmailClient = "EmailClient",
    Language = "Language",
    Mandrill = "Mandrill",
    MemberRating = "MemberRating",
    SignupSource = "SignupSource",
    SurveyMonkey = "SurveyMonkey",
    VIP = "VIP",
    Interests = "Interests",
    EcommCategory = "EcommCategory",
    EcommNumber = "EcommNumber",
    EcommPurchased = "EcommPurchased",
    EcommSpent = "EcommSpent",
    EcommStore = "EcommStore",
    GoalActivity = "GoalActivity",
    GoalTimestamp = "GoalTimestamp",
    FuzzySegment = "FuzzySegment",
    StaticSegment = "StaticSegment",
    IPGeoCountryState = "IPGeoCountryState",
    IPGeoIn = "IPGeoIn",
    IPGeoInZip = "IPGeoInZip",
    IPGeoUnknown = "IPGeoUnknown",
    IPGeoZip = "IPGeoZip",
    SocialAge = "SocialAge",
    SocialGender = "SocialGender",
    SocialInfluence = "SocialInfluence",
    Follow = "Follow",
    AddressMerge = "AddressMerge",
    ZipMerge = "ZipMerge",
    BirthdayMerge = "BirthdayMerge",
    DateMerge = "DateMerge",
    TextMerge = "TextMerge",
    SelectMerge = "SelectMerge",
    EmailAddress = "EmailAddress",
    PredictedAge = "PredictedAge",
    PredictedGender = "PredictedGender",
}

export interface SegmentCondition {
    condition_type: SegmentConditionType,
    op: SegmentOperator|string,
    field: SegmentField|string,
    extra?: string,
    value: SegmentValue|string|number,
}

export interface SavedSegmentOption {
    saved_segment_id: number;
    prebuilt_segment_id?:number;
}

export interface SegmentConditionOption {
    match: SegmentMatchType;
    conditions: SegmentCondition[];
}

export interface CreateCampaignRequestRecipients {
    list_id: string
    // An object representing all segmentation options.
    // This object should contain a saved_segment_id to use an existing segment,
    // or you can create a new segment by including both match and conditions options.
    segment_opts?: SavedSegmentOption|SegmentConditionOption;

}

export interface CreateCampaignSettings {
    subject_line?: string,
    preview_text?: string,
    title: string,
    from_name?: string,
    reply_to?: string,
    use_conversation?: boolean,
    to_name?: string,
    folder_id?: string,
    authenticate?: boolean,
    auto_footer?: boolean,
    inline_css?: boolean,
    auto_tweet?: boolean,
    auto_fb_post?:string[], //array of page ids to post to
    fb_comments?:boolean,
    template_id?:number,
}

export interface UpdateCampaignSettings {
    subject_line: string,
    preview_text?: string,
    title?: string,
    from_name: string,
    reply_to: string,
    use_conversation?: boolean,
    to_name?: string,
    folder_id?: string,
    authenticate?: boolean,
    auto_footer?: boolean,
    inline_css?: boolean,
    auto_tweet?: boolean,
    auto_fb_post?:string[], //array of page ids to post to
    fb_comments?:boolean,
    template_id?:number,
}

export interface CampaignTracking {
    opens?:boolean,
    html_clicks?: boolean,
    text_clicks?: boolean,
    goal_tracking?:boolean,
    ecomm360?:boolean,
    google_analytics?: string, //custom clug for GA tracking
    clicktale?:string,
}

export interface CreateCampaignRequest {
    type: CampaignType,
    recipients: CreateCampaignRequestRecipients,
    settings?: CreateCampaignSettings,
    variate_settings?: {
        //not used yet
    },
    tracking?: CampaignTracking,
    social_card?: CampaignSocialCard
}


export interface UpdateCampaignRequest {
    recipients?: CreateCampaignRequestRecipients,
    settings: UpdateCampaignSettings|CreateCampaignSettings,
    variate_settings?: {
        //not used yet
    },
    tracking?: CampaignTracking,
    social_card?: {
        image_url?: string,
        description?: string,
        title?: string,
    }
}

export enum TemplateSection {
    question = "question",
    content_link = "content_link",
    inspiration = "inspiration",
    reflectionPromptId = "reflection_prompt_id",
    prompt_topic = "prompt_topic",
}

export interface CampaignContentSectionMap {
    [id: string]: string
}

export interface CampaignContentRequest {
    plain_text?: string,
    html?: string,
    url?: string,
    template?: {
        id: number,
        sections: CampaignContentSectionMap
    }
}

export interface CampaignContent {
    variate_contents?: {
        content_label: string,
        plain_text: string,
        html: string,
    }[],
    plain_text: string,
    html: string,
    archive_html: string,
    _links: MailchimpLink[],
}