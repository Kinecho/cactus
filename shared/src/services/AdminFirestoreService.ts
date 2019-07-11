import * as firebaseAdmin from "firebase-admin";
import CollectionReference = firebaseAdmin.firestore.CollectionReference;
import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot, fromQuerySnapshot} from "@shared/util/FirestoreUtil";
import DocumentReference = firebaseAdmin.firestore.DocumentReference;
import DocumentSnapshot = firebaseAdmin.firestore.DocumentSnapshot;
import Timestamp = firebaseAdmin.firestore.Timestamp;
import {GetOptions, IQueryOptions, QueryResult} from "@shared/types/FirestoreTypes";
import {DefaultGetOptions, DefaultQueryOptions} from "@shared/types/FirestoreConstants";

export type QueryCursor = string | number | DocumentSnapshot | Timestamp;

export interface QueryOptions extends IQueryOptions<QueryCursor> {
}

export default class AdminFirestoreService {
    admin: firebaseAdmin.app.App;
    firestore: FirebaseFirestore.Firestore;


    protected static sharedInstance: AdminFirestoreService;

    static getSharedInstance(): AdminFirestoreService {
        if (!AdminFirestoreService.sharedInstance) {
            throw new Error("No shared instance is available. Ensure you have called the initialize() function before using the shared instance")
        }
        return AdminFirestoreService.sharedInstance;
    }

    static initialize(app: firebaseAdmin.app.App) {
        console.log("Initializing firestore service");
        AdminFirestoreService.sharedInstance = new AdminFirestoreService(app);
    }

    constructor(admin: firebaseAdmin.app.App) {
        this.admin = admin;
        this.firestore = admin.firestore()
    }

    getCollectionRef(collectionName: Collection): CollectionReference {
        return this.firestore.collection(collectionName);
    }

    getCollectionRefFromModel(model: BaseModel): CollectionReference {
        return this.firestore.collection(model.collection);
    }

    getDocumentRefFromModel(model: BaseModel): DocumentReference {
        const collectionRef = this.getCollectionRefFromModel(model);
        let doc: DocumentReference;
        if (model.id) {
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
    initializeModel<T extends BaseModel>(model: T): T {
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

    async getById<T extends BaseModel>(id: string, Type: { new(): T }, options: GetOptions = DefaultGetOptions): Promise<T | undefined> {
        const type = new Type();

        const collection = this.getCollectionRef(type.collection);

        console.log(`Fetching ${type.collection} with ID = ${id}`);

        const doc = await collection.doc(id).get();

        if (!doc) {
            return;
        }

        if (!options.includeDeleted && doc.get("deleted") === true) {
            console.warn("Document is deleted, and the request options did not include deleted objects");
            return;
        }

        console.log(`doc.data()`, doc.data());

        return fromDocumentSnapshot(doc, Type);
    }


    async getFirst<T extends BaseModel>(query: FirebaseFirestore.Query, Type: { new(): T }, options: QueryOptions = DefaultQueryOptions): Promise<T | undefined> {
        const response = await this.executeQuery(query, Type, options);
        const [first] = response.results;
        return first;
    }

    async executeQuery<T extends BaseModel>(originalQuery: FirebaseFirestore.Query, Type: { new(): T }, options: QueryOptions = DefaultQueryOptions): Promise<QueryResult<T>> {
        let query = originalQuery;
        if (!options.includeDeleted) {
            query = query.where("deleted", "==", false);
        } else if (options.onlyDeleted) {
            query = query.where("deleted", "==", true)
        }

        if (options.pagination) {
            query = query.limit(options.pagination.limit).orderBy(options.pagination.orderBy, options.pagination.sortDirection);

            if (options.pagination.startAfter) {
                query = query.startAfter(options.pagination.startAfter);
            } else if (options.pagination.startAt) {
                query = query.startAt(options.pagination.startAt);
            } else if (options.pagination.endAt) {
                query = query.endAt(options.pagination.endAt);
            } else if (options.pagination.endBefore) {
                query.endBefore(options.pagination.endBefore);
            }
        }


        const snapshot = await query.get();

        const size = snapshot.size;
        const results: T[] = fromQuerySnapshot(snapshot, Type);

        return {results, size};
    }

    async delete<T extends BaseModel>(id: string, Type: { new(): T }): Promise<T | undefined> {
        const model = await this.getById(id, Type);
        if (model && !model.deleted) {
            model.deleted = true;
            model.deletedAt = new Date();
            await this.save(model);
        } else if (model && model.deleted) {
            console.warn("Model is already deleted. Not performing any action");
        } else {
            console.warn("No object found for given id. Not deleting anything.");
        }

        return model;
    }
}


