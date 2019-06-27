import * as firebaseAdmin from "firebase-admin";
import CollectionReference = firebaseAdmin.firestore.CollectionReference;
import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirebaseUtil";
import DocumentReference = firebaseAdmin.firestore.DocumentReference;

export interface QueryResult<T extends BaseModel> {
    results:T[],
    size: number,
}

export default class AdminFirestoreService {
    admin: firebaseAdmin.app.App;
    firestore: FirebaseFirestore.Firestore;



    protected static sharedInstance:AdminFirestoreService;

    static getSharedInstance():AdminFirestoreService{
        if (!AdminFirestoreService.sharedInstance){
            throw new Error("No shared instance is available. Ensure you have called the initialize() function before using the shared instance")
        }
        return AdminFirestoreService.sharedInstance;
    }

    static initialize(app: firebaseAdmin.app.App){
        console.log("Initializing firestore service");
        AdminFirestoreService.sharedInstance = new AdminFirestoreService(app);
    }

    constructor(admin: firebaseAdmin.app.App){
        this.admin = admin;
        this.firestore = admin.firestore()
    }

    getCollectionRef(collectionName: Collection): CollectionReference {
        return this.firestore.collection(collectionName);
    }

    getCollectionRefFromModel(model: BaseModel): CollectionReference {
        return this.firestore.collection(model.collection);
    }

    getDocumentRefFromModel(model:BaseModel):DocumentReference {
        const collectionRef = this.getCollectionRefFromModel(model);
        let doc:DocumentReference;
        if (model.id){
            doc = collectionRef.doc(model.id)
        } else {
            doc = collectionRef.doc();
        }

        return doc;
    }

    async listCollections(): Promise<CollectionReference[]> {
        return this.firestore.listCollections();
    }

    /**
     * Generate an ID and set date fields for the model, but don't save it
     * @param {T} model
     * @return {T}
     */
    initializeModel<T extends BaseModel>(model: T):T{
        const collectionRef = this.getCollectionRef(model.collection);
        let doc = collectionRef.doc();
        if (model.id) {
            doc = collectionRef.doc(model.id);
        } else {
            model.id = doc.id;
            model.createdAt = new Date();
        }

        model.updatedAt = new Date();
        return model;
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

            // const doc = this.getDocumentRefFromModel(model);



            const data = await model.toFirestoreData();
            // console.log("Data to save:", JSON.stringify(data));

            await doc.set(data, {merge: true});

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

        console.log(`doc.data()`, doc.data());

        return fromDocumentSnapshot(doc, Type);
    }

    async executeQuery<T extends BaseModel>(query:FirebaseFirestore.Query, Type: { new(): T }):Promise<QueryResult<T>>{
        const snapshot = await query.get();
        const size = snapshot.size;
        const results:T[] = [];
        if (snapshot.empty){
            return  {results, size};
        }

        snapshot.forEach(doc => {
            const model = fromDocumentSnapshot(doc, Type);
            if (model){
                results.push(model);
            } else {
                console.warn("Unable to decode model", Type);
            }
        });


        return {results, size};
    }
}


