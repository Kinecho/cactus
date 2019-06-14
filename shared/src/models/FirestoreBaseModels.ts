import {convertDateToTimestamp} from "@shared/util/FirebaseUtil";


export enum Collection {
    emailReply = "emailReply",
    testModels = "testModels",
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

    async toFirestoreData(removeKeys=["id"]):Promise<any> {
        const data = await convertDateToTimestamp(this);
        removeKeys.forEach(key => {
            delete data[key];
        });
        return data;
    }
}
