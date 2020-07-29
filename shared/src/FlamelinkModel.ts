import { FlamelinkTimestamp } from "@shared/types/FlamelinkWebhookTypes";
import { convertDateToJSON, convertDateToTimestamp } from "@shared/util/FirestoreUtil";
import Logger from "@shared/Logger";

const logger = new Logger("FlamelinkModel");

export enum SchemaName {
    promptContent = "promptContent",
    subscriptionProducts = "subscriptionProducts",
    subscriptionProductGroups = "subscriptionProductGroups",
    appSettings = "appSettings_web",
    promotionalOffer = "promotionalOffer",
    experiments = "experiments",
    // coreValuesAssessment = "coreValuesAssessment",
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
    schema: SchemaName,
    schemaRef: any,
    schemaType: string,

}

export interface FlamelinkData extends Record<string, any> {
    _fl_meta_?: FlamelinkMeta
    id?: string;
    parentId?: string | number;
    order?: number;
}

export interface FlamelinkIdentifiable extends FlamelinkData {
    readonly schema: SchemaName,
    _fl_meta_?: FlamelinkMeta
}


export default abstract class FlamelinkModel implements FlamelinkIdentifiable {
    abstract readonly schema: SchemaName;
    parentId?: string | number;
    order?: number;
    documentId?: string;
    entryId!: string;
    _fl_meta_?: FlamelinkMeta;

    protected constructor(data?: FlamelinkData) {
        if (data) {
            this.updateFromData(data)
        }
    }

    updateFromData(data: FlamelinkData) {
        this._fl_meta_ = data._fl_meta_;
        this.documentId = this._fl_meta_ ? this._fl_meta_.docId : data.id;
        this.parentId = data.parentId;
        this.order = data.order;

        const entryId = this._fl_meta_?.fl_id
        if (entryId) {
            this.entryId = entryId;
        }
        // this.entryId = this._fl_meta_ ? this._fl_meta_.fl_id : undefined;
        //this seems to happen when updating after saving the object via Flamelink SDK
        if (data["_fl_meta_.fl_id"] && !this.entryId) {
            this.entryId = data["_fl_meta_.fl_id"]
        }
    }

    prepareForFirestore(): any {
        return { ...this };
    }

    toFlamelinkData(removeKeys = ["schema", "entryId", "_fl_meta_"]): any {
        const prepared = this.prepareForFirestore();
        if (!prepared) {
            throw new Error("Unable to prepare for firestore");
        }
        const data = convertDateToTimestamp(prepared);
        // logger.log("data after converting to dates", data);

        if (removeKeys && data) {
            removeKeys.forEach(key => {
                delete data[key];
            });
        }

        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        return data;
    }

    toJSON(removeKeys = ["schema", "_fl_meta_.schemaRef"]): any {
        try {
            const data = convertDateToJSON({ ...this });

            const keysToRemove = Array.isArray(removeKeys) ? removeKeys : ["schema", "_fl_meta_.schemaRef"];
            if (keysToRemove && Array.isArray(keysToRemove) && data) {
                keysToRemove.forEach(key => {
                    delete data[key];
                });
            }

            if (data.hasOwnProperty("_fl_meta_")) {
                delete data._fl_meta_.schemaRef;
            }

            return data;
        } catch (error) {
            logger.error(error);
            return { message: "Error processing this model toJSON", error };
        }
    }
}