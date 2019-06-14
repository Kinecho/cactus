import * as admin from "firebase-admin";
import CollectionReference = admin.firestore.CollectionReference;
import {BaseModel, Collection} from "@shared/models/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirebaseUtil";

export function getCollectionRef(collectionName: Collection): CollectionReference {
    return admin.firestore().collection(collectionName);
}

export async function save<T extends BaseModel>(model: T): Promise<T> {
    try {
        const collectionRef = getCollectionRef(model.collection);
        let doc = collectionRef.doc();
        if (model.id) {
            doc = collectionRef.doc(model.id);
        } else {
            model.id = doc.id;
            model.createdAt = new Date();
        }

        model.updatedAt = new Date();

        const data = await model.toFirestoreData();
        console.log("Data to save:", JSON.stringify(data));

        const writeResult = await doc.set(data, {merge: true});

        console.log("writeResult", writeResult);

        return model;
    } catch (e) {
        console.error("failed to save firestore document", e);
        throw e;
    }
}

export async function getById<T extends BaseModel>(id: string, Type: { new(): T }): Promise<T | null> {
    const type = new Type();

    const collection = getCollectionRef(type.collection);

    console.log(`Fetching ${type.collection} with ID = ${id}`);

    const doc = await collection.doc(id).get();

    if (!doc) {
        return null;
    }

    return await fromDocumentSnapshot(doc, Type);
}