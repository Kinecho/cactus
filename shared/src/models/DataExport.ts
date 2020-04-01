import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum DataExportField {
    downloadCount = "downloadCount",
}

export default class DataExport extends BaseModel {
    static Fields = DataExportField;
    collection = Collection.dataExports;
    memberId!: string;
    downloadCount = 0;

    constructor(memberId?: string) {
        super();
        if (memberId) {
            this.memberId = memberId;
        }
    }
}