import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export default class DataExport extends BaseModel {
    collection = Collection.dataExports;
    memberId!: string;

    constructor(memberId?: string) {
        super();
        if (memberId) {
            this.memberId = memberId;
        }
    }
}