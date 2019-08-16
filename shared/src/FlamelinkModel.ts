import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import {FlamelinkTimestamp} from "@shared/types/FlamelinkWebhookTypes";

export enum SchemaName {
    promptContent = "promptContent",
}

export interface FlamelinkMeta {

    createdBy: string,
    createdDate: FlamelinkTimestamp,
    docId: string,
    env: string,
    fl_id: string,
    lastModifiedBy: string,
    lastModifiedDate: FlamelinkTimestamp,
    locale: string,
    schema: string,
    schemaRef: any,
    schemaType: string,

}

export interface FlamelinkData {
    _fl_meta_?: FlamelinkMeta
    id?: string;
    parentId?: string | number;
    order?: number,

    [key: string]: any
}

export interface FlamelinkIdentifiable extends FlamelinkData {
    schema: SchemaName,
    _fl_meta_?: FlamelinkMeta
}


export default abstract class FlamelinkModel implements FlamelinkIdentifiable {
    abstract readonly schema: SchemaName;
    parentId?: string | number;
    order?: number;
    documentId?: string;
    entryId?: string;
    _fl_meta_?: FlamelinkMeta;

    protected constructor(data?: FlamelinkData) {
        if (data) {
            this._fl_meta_ = data._fl_meta_;
            this.documentId = this._fl_meta_ ? this._fl_meta_.docId : data.id;
            this.parentId = data.parentId;
            this.order = data.order;
            this.entryId = this._fl_meta_ ? this._fl_meta_.fl_id : undefined;
        }
    }
}