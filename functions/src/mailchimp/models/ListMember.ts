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
}

export default class ListMember {
    email_address: String;
    status = ListMemberStatus.subscribed;
    merge_fields = new Map<MergeField, String|Number|undefined>();

    constructor(email:String){
        this.email_address = email;

    }

    addMergeField(field:MergeField, value?:String|Number){
        console.log("setting merge field", field, value);
        this.merge_fields.set(field, value);
        console.log("merge fields to json", JSON.stringify(this.merge_fields));
    }

    removeMergeField(field:MergeField){
        this.merge_fields.delete(field);
    }
}