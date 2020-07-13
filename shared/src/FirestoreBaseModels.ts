import { convertDateToJSON, convertDateToTimestamp, isTimestamp, TimestampInterface } from "@shared/util/FirestoreUtil";
import Logger from "@shared/Logger";
import { toPlainObject } from "@shared/util/ObjectUtil";

const logger = new Logger("FirestoreBaseModels");

export enum Collection {
    emailReply = "emailReply",
    testModels = "testModels",
    sentCampaigns = "sentCampaigns",
    reflectionResponses = "reflectionResponses",
    users = "users",
    members = "members",
    reflectionPrompt = "reflectionPrompt",
    sentPrompts = "sentPrompts",
    pendingUsers = "pendingUsers",
    socialInvites = "socialInvites",
    socialConnections = "socialConnections",
    memberProfiles = "memberProfiles",
    socialConnectionRequests = "socialConnectionRequests",
    flamelink_content = "fl_content",
    checkoutSessions = "checkoutSessions",
    payments = "payments",
    emailLogs = "emailLogs",
    dataExports = "dataExports",
    coreValuesAssessmentResponses = "coreValuesAssessmentResponses",
    deletedUsers = "deletedUsers",
    gapAnalysisAssessmentResults = "gapAnalysisAssessmentResults",
    notifications = "notifications",
}

export interface FirestoreIdentifiable {
    collection: Collection,
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum BaseModelField {
    id = "id",
    createdAt = "createdAt",
    updatedAt = "updatedAt",
    deleted = "deleted",
    deletedAt = "deletedAt",
}

export abstract class BaseModel implements FirestoreIdentifiable {
    abstract readonly collection: Collection;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deleted?: boolean = false;
    deletedAt?: Date;

    prepareForFirestore(): any {
        return { ...this };
    }

    prepareFromFirestore(data: any): any {
        return this;
    }

    toFirestoreData(removeKeys = ["id", "collection"]): any {
        const prepared = this.prepareForFirestore();
        if (!prepared) {
            throw new Error("Unable to prepare for firestore");
        }
        let data = convertDateToTimestamp(prepared);
        logger.debug("data after converting to dates", data);

        if (removeKeys && data) {
            removeKeys.forEach(key => {
                delete data[key];
            });
        }

        data = toPlainObject(data);

        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        return data;
    }

    toJSON(removeKeys = ["collection"]): any {
        try {
            const copy = Object.assign({}, this);
            const data = convertDateToJSON(copy);
            const keysToRemove = Array.isArray(removeKeys) ? removeKeys : ["collection"];
            if (keysToRemove && Array.isArray(keysToRemove) && data) {
                keysToRemove.forEach(key => {
                    delete data[key];
                });
            }
            return data;
        } catch (error) {
            logger.error("Error processing this model toJSON", error);
            return { message: "Error processing this model toJSON", error };
        }
    }

    /**
     * This method gives you the chance to convert things like json dates to Date objects.
     * You can override this method in your concrete class if you need additional customization
     * @param {object} json
     */
    decodeJSON(json: any) {
        Object.assign(this, json);

        this.createdAt = this.decodeDate(json.createdAt);
        this.updatedAt = this.decodeDate(json.updatedAt);
        this.deletedAt = this.decodeDate(json.deletedAt);
    }

    decodeDate(input?: number | null | undefined | string | Date | TimestampInterface): Date | undefined {
        if (!input) {
            return undefined;
        }
        if (isTimestamp(input)) {
            return input.toDate()
        }

        try {
            const d = new Date(input)
            if (isNaN(d.getTime())) {
                return undefined;
            }
            return d;
        } catch (error) {
            return undefined;
        }
    }
}
