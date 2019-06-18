import {CampaignType, MailchimpLink} from "@shared/mailchimp/models/MailchimpTypes";

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

export interface SegmentCondition {
    condition_type?: string,
    op: SegmentOperator|string,
    field: SegmentField|string,
    extra: string,
    value: SegmentValue|string,
}

export interface CreateCampaignRequest {
    type: CampaignType,
    recipients: {
        list_id: string,
        // An object representing all segmentation options.
        // This object should contain a saved_segment_id to use an existing segment,
        // or you can create a new segment by including both match and conditions options.
        segment_options?: {
            saved_segment_id?: number,
            prebuilt_segment_id?: string, //The prebuilt segment id, if a prebuilt segment has been designated for this campaign.
            match?: SegmentMatchType,
            conditions?: SegmentCondition[]
        }
    },
    settings?: {
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
    },
    variate_settings?: {
        //not used yet
    },
    tracking?: {
        opens?:boolean,
        html_clicks?: boolean,
        text_clicks?: boolean,
        goal_tracking?:boolean,
        ecomm360?:boolean,
        google_analytics?: string, //custom clug for GA tracking
        clicktale?:string,
    },
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
}

export interface CampaignContentRequest {
    plain_text?: string,
    html?: string,
    url?: string,
    template?: {
        id: number,
        sections: {
            [key in keyof typeof TemplateSection]: string
        }
    }
}

export interface CampaignContentResponse {
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