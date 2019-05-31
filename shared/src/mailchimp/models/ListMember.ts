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
    DO_REMIND = "DO_REMIND"
}

export enum TagName {
    NEEDS_REMINDER = "needs_reminder"
}

export enum TagStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export interface Tag {
    name: TagName,
    status: TagStatus
}


export enum MergeFieldBoolean {
    YES = "YES",
    NO = "NO"
}

export type MergeFields = {
    [s in MergeField]?: String|Number|MergeFieldBoolean;
};

export default class ListMember {
    email_address: String;
    status = ListMemberStatus.pending;
    merge_fields: MergeFields = {};

    constructor(email:String){
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