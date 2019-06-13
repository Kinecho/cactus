import * as admin from "firebase-admin";
import CollectionReference = admin.firestore.CollectionReference;

export enum Collection {
    emailReply = "emailReply",
    users = "users",
}


export function getCollectionRef(collectionName:Collection):CollectionReference{
    return admin.firestore().collection(collectionName);
}

