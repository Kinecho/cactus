import {convertDateToJSON, convertDateToTimestamp} from "@shared/util/FirestoreUtil";


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
        return this;
    }

    prepareFromFirestore(data: any): any {
        return this;
    }

    toFirestoreData(removeKeys = ["id", "collection"]): any {
        const prepared = this.prepareForFirestore();
        if (!prepared) {
            throw new Error("Unable to prepare for firestore");
        }
        const data = convertDateToTimestamp(prepared);
        // console.log("data after converting to dates", data);

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

    toJSON(removeKeys = ["collection"]): any {
        try {
            const data = convertDateToJSON(this);

            if (removeKeys && data) {
                removeKeys.forEach(key => {
                    delete data[key];
                });
            }
            return data;
        } catch (error) {
            return {message: "Error processing this model toJSON", error};
        }
    }

    /**
     * This method gives you the chance to convert things like json dates to Date objects.
     * You can override this method in your concrete class if you need additional customization
     * @param {object} json
     */
    decodeJSON(json: any) {
        Object.assign(this, json);

        this.createdAt = json.createdAt ? new Date(json.createdAt) : undefined;
        this.updatedAt = json.updatedAt ? new Date(json.updatedAt) : undefined;
        this.deletedAt = json.deletedAt ? new Date(json.deletedAt) : undefined;
    }
}
