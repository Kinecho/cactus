import { BaseModel, Collection } from "@shared/FirestoreBaseModels";

export enum DataExportField {
    downloadCount = "downloadCount",
}

export default class DataExport extends BaseModel {
    static Fields = DataExportField;
    collection = Collection.dataExports;
    memberId!: string;
    type?: "direct_download" | "email";
    downloadCount = 0;
    sendToEmail: string | undefined;
    emailSent: boolean = false;
    emailLogId?: string | undefined;

    constructor(memberId?: string) {
        super();
        if (memberId) {
            this.memberId = memberId;
        }
    }
}