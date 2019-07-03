import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import {JournalStatus} from "@shared/models/CactusMember";
import {convertDateToJSON, convertDateToTimestamp} from "@shared/util/FirebaseUtil";
import {getDateFromISOString} from "@shared/util/DateUtil";

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
    JNL_STATUS = "JNL_STATUS",
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
    [s in MergeField]?: String|Number|MergeFieldBoolean|JournalStatus;
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

    toFirestoreData(){
        let data = Object.assign({}, this) as any;
        data.timestamp_signup = getDateFromISOString(data.timestamp_signup);
        data.timestamp_opt = getDateFromISOString(data.timestamp_opt);

        if (data.last_note){
            data.last_note = getDateFromISOString(data.last_note);
        }

        data = convertDateToTimestamp(this);
        // console.log("data after converting to dates", data);

        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        return data;
    }

    toJSON(){
        let data = Object.assign({}, this) as any;
        data.timestamp_signup = getDateFromISOString(data.timestamp_signup);
        data.timestamp_opt = getDateFromISOString(data.timestamp_opt);

        if (data.last_note){
            data.last_note = getDateFromISOString(data.last_note);
        }

        data = convertDateToJSON(this);
        // console.log("data after converting to dates", data);

        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        return data;
    }
}