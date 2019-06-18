import * as firebaseAdmin from "firebase-admin";
import CollectionReference = firebaseAdmin.firestore.CollectionReference;
import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirebaseUtil";

export default class AdminFirestoreService {
    admin: firebaseAdmin.app.App;
    firestore: FirebaseFirestore.Firestore;

    constructor(admin: firebaseAdmin.app.App){
        this.admin = admin;
        this.firestore = admin.firestore()
    }

    getCollectionRef(collectionName: Collection): CollectionReference {
        return this.firestore.collection(collectionName);
    }

    async listCollections(): Promise<CollectionReference[]> {
        return this.firestore.listCollections();
    }

    async save<T extends BaseModel>(model: T): Promise<T> {
        try {
            const collectionRef = this.getCollectionRef(model.collection);
            let doc = collectionRef.doc();
            if (model.id) {
                doc = collectionRef.doc(model.id);
            } else {
                model.id = doc.id;
                model.createdAt = new Date();
            }

            model.updatedAt = new Date();

            const data = await model.toFirestoreData();
            // console.log("Data to save:", JSON.stringify(data));

            const writeResult = await doc.set(data, {merge: true});

            console.log("writeResult", writeResult);

            return model;
        } catch (e) {
            console.error("failed to save firestore document", e);
            throw e;
        }
    }

    async getById<T extends BaseModel>(id: string, Type: { new(): T }): Promise<T | null> {
        const type = new Type();

        const collection = this.getCollectionRef(type.collection);

        console.log(`Fetching ${type.collection} with ID = ${id}`);

        const doc = await collection.doc(id).get();

        if (!doc) {
            return null;
        }

        return await fromDocumentSnapshot(doc, Type);
    }
}


