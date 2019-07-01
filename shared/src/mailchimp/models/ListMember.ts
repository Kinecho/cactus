import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";

export enum ListMemberStatus {
    subscribed = "subscribed",
    unsubscribed = "unsubscribed",
    cleaned = "cleaned",
    pending = "pending"
}

export enum MergeField {
    FNAME = "FNAME",
    LNAME = "LNAME",
    REF_EMAIL = "REF_EMAIL",
    LAST_REPLY = "LAST_REPLY",
}

export enum TagName {
    NEEDS_ONBOARDING_REMINDER = "needs_onboarding_reminder",
    JOURNAL_PREMIUM = "journal_premium",
}

export enum TagStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export interface Tag {
    name?: TagName,
    id?: string,
    status?: TagStatus
}

export enum MergeFieldBoolean {
    YES = "YES",
    NO = "NO"
}

export type MergeFields = {
    [s in MergeField]?: String|Number|MergeFieldBoolean;
};

export default class ListMember {
    id?: string;
    web_id?: string;
    email_type?: string;
    email_address?: string;
    unique_email_id?: string;
    status = ListMemberStatus.pending;
    merge_fields: MergeFields = {};
    stats?: {
        avg_open_rate: number,
        avg_click_rate: number,
    };
    tags: Tag[] = [];
    list_id?: string;
    timestamp_signup?: ISODate;
    timestamp_opt?: ISODate;
    email_client?:string;
    localtion?: {
        latitude: number,
        longitude: number,
        gmtoff: number, //The time difference in hours from GMT.
        dstoff: number, //The offset for timezones where daylight saving time is observed.
        country_code: string,
        timezone: string,
    };
    marketing_permissions:{
        marketing_permission_id:string,
        text:string,
        enabled:boolean,
    }[] = [];
    last_note?: {
        note_id: number,
        created_at: ISODate,
        created_by: string,
        note: string
    };
    source?: string;
    tags_count?: number;


    constructor(email?:string){
        this.email_address = email;
    }

    addMergeField(field:MergeField, value?:String|Number){
        console.log("setting merge field", field, value);
        // this.merge_fields.set(field, value);
        this.merge_fields[field] = value;
        console.log("merge fields to json", JSON.stringify(this.merge_fields));
    }

    removeMergeField(field:MergeField){
        delete this.merge_fields[field];
    }
}