import * as admin from "firebase-admin";
import CollectionReference = admin.firestore.CollectionReference;
import {BaseModel, Collection} from "@shared/models/FirestoreBaseModels";

export function getCollectionRef(collectionName:Collection):CollectionReference{
    return admin.firestore().collection(collectionName);
}

export async function save<T extends BaseModel>(model:T):Promise<T> {

    const collectionRef = getCollectionRef(model.collection);
    let doc = collectionRef.doc();
    if (model.id){
        doc = collectionRef.doc(model.id);
    } else {
        model.id = doc.id;
        model.createdAt = new Date();
    }

    model.updatedAt = new Date();

    const data = model.toFirestoreData();
    const writeResult = await doc.set(data, {merge: true});

    console.log("writeResult", writeResult);



    return model;
}