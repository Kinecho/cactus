import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum Field {
    email = "email",

}

export default class User extends BaseModel {
    collection = Collection.users;
    email?: string;
    cactusMemberId?:string;
    phoneNumber?:string;
    providerIds:string[] = [];

    prepareForFirestore(): any {
        const object = super.prepareForFirestore();
        object.email = this.email ? this.email.toLowerCase().trim() : undefined;
        return object;
    }
}