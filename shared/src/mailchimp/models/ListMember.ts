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
    email_address: string;
    unique_email_id?: string;
    status = ListMemberStatus.pending;
    merge_fields: MergeFields = {};
    stats?: {
        avg_open_rate: number,
        avg_click_rate: number,
    };
    tags: Tag[] = [];
    list_id?: string;

    constructor(email:string){
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