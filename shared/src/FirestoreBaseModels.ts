import {convertDateToJSON, convertDateToTimestamp} from "@shared/util/FirebaseUtil";


export enum Collection {
    emailReply = "emailReply",
    testModels = "testModels",
    sentCampaigns = "sentCampaigns",
    reflectionResponses = "reflectionResponses",
    users = "users",
}

export interface FirestoreIdentifiable {
    collection: Collection,
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export abstract class BaseModel implements FirestoreIdentifiable{
    abstract readonly collection: Collection;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deleted?:boolean = false;
    deletedAt?:Date;

    async toFirestoreData(removeKeys=["id", "collection"]):Promise<any> {
        const data = await convertDateToTimestamp(this);
        console.log("data after converting to dates", data);

        if (removeKeys && data){
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

    async toJSON(removeKeys=["collection"]):Promise<any> {
        const data = await convertDateToJSON(this);

        if (removeKeys && data){
            removeKeys.forEach(key => {
                delete data[key];
            });
        }
        return data;
    }

    /**
     * This method gives you the chance to convert things like json dates to Date objects.
     * You can override this method in your concrete class if you need additional customization
     * @param {object} json
     */
    decodeJSON(json:any){
        Object.assign(this, json);

        this.createdAt = json.createdAt ? new Date(json.createdAt) : undefined;
        this.updatedAt = json.updatedAt ? new Date(json.updatedAt) : undefined;
        this.deletedAt = json.deletedAt ? new Date(json.deletedAt) : undefined;
    }
}
