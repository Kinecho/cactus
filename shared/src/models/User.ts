import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum Field {
    email = "email",
    providerIds = "providerIds",
    phoneNumber = "phoneNumber",
    cactusMemberId = "cactusMemberId",
    referredByEmail = "referredByEmail",
}

export default class User extends BaseModel {
    static Field = Field;
    collection = Collection.users;
    lastLoginAt?: Date;
    email?: string;
    cactusMemberId?:string;
    phoneNumber?:string;
    providerIds:string[] = [];
    claims: string[] = [];
    isAdmin:boolean = false;
    referredByEmail?:string;

    prepareForFirestore(): any {
        const object = super.prepareForFirestore();
        object.email = this.email ? this.email.toLowerCase().trim() : undefined;
        return object;
    }
}