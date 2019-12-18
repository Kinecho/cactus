import * as firebaseAdmin from "firebase-admin";
import {BaseModel, BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot, fromQuerySnapshot} from "@shared/util/FirestoreUtil";
import {IGetOptions, IQueryOptions, QueryResult} from "@shared/types/FirestoreTypes";
import * as Sentry from "@sentry/node"
import AdminSlackService from "@admin/services/AdminSlackService";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import DocumentReference = firebaseAdmin.firestore.DocumentReference;
import DocumentSnapshot = firebaseAdmin.firestore.DocumentSnapshot;
import Timestamp = firebaseAdmin.firestore.Timestamp;
export import Transaction = firebaseAdmin.firestore.Transaction;
export import CollectionReference = firebaseAdmin.firestore.CollectionReference;

export type QueryCursor = string | number | DocumentSnapshot | Timestamp;

export interface QueryOptions extends IQueryOptions<QueryCursor> {
    transaction?: Transaction
}

export interface GetOptions extends IGetOptions {
    transaction?: Transaction
    throwOnError?: boolean,
}

export const DefaultQueryOptions: QueryOptions = {
    includeDeleted: false,
    onlyDeleted: false,
    transaction: undefined
};

export const DefaultGetOptions: GetOptions = {
    includeDeleted: false,
    onlyDeleted: false,
    transaction: undefined,
    throwOnError: false,
};


export interface SaveOptions {
    setUpdatedAt?: boolean,
    transaction?: Transaction
}


export const DEFAULT_SAVE_OPTIONS: SaveOptions = {
    setUpdatedAt: true,
    transaction: undefined
};

export function getDefaultOptions(): SaveOptions {
    return {...DEFAULT_SAVE_OPTIONS}
}

export const DEFAULT_BATCH_SIZE = 500;

export default class AdminFirestoreService {
    admin: firebaseAdmin.app.App;
    firestore: FirebaseFirestore.Firestore;
    static Timestamp = Timestamp;

    protected static sharedInstance: AdminFirestoreService;

    static getSharedInstance(): AdminFirestoreService {
        if (!AdminFirestoreService.sharedInstance) {
            throw new Error("No shared AdminFirestoreService instance is available. Ensure you have called the initialize() function before using the shared instance")
        }
        return AdminFirestoreService.sharedInstance;
    }

    static initialize(app: firebaseAdmin.app.App) {
        console.log("Initializing firestore service");
        AdminFirestoreService.sharedInstance = new AdminFirestoreService(app);
    }

    constructor(admin: firebaseAdmin.app.App) {
        this.admin = admin;
        this.firestore = admin.firestore();
    }

    getCollectionRef(collectionName: Collection): CollectionReference {
        return this.firestore.collection(collectionName);
    }

    getCollectionRefFromModel(model: BaseModel): CollectionReference {
        return this.firestore.collection(model.collection);
    }

    getDocumentRefFromModel(model?: BaseModel): DocumentReference | undefined {
        if (!model) {
            return undefined
        }
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

    /**
     * Get a Firestore transaction. The function must return a result of the transaction.
     * @param {(transaction: Transaction) => Promise<any>} updateFunction
     * @param {{maxAttempts: number | undefined}} options
     * @return {Promise<{}>}
     */
    async runTransaction(updateFunction: (transaction: Transaction) => Promise<any>, options?: { maxAttempts: number | undefined }): Promise<{}> {
        return this.firestore.runTransaction(async t => {
            return await updateFunction(t);
        }, options)
    }

    async save<T extends BaseModel>(model: T, opts: SaveOptions = DEFAULT_SAVE_OPTIONS): Promise<T> {
        try {
            const options = {...DEFAULT_SAVE_OPTIONS, ...opts};
            const collectionRef = this.getCollectionRef(model.collection);
            let doc = collectionRef.doc();
            if (model.id) {
                doc = collectionRef.doc(model.id);
            } else {
                model.id = doc.id;
                model.createdAt = new Date();
            }

            if (options.setUpdatedAt) {
                model.updatedAt = new Date();
            }

            // const doc = this.getDocumentRefFromModel(model);

            const data = await model.toFirestoreData();
            // console.log("Data to save:", JSON.stringify(data));
            if (options.transaction) {
                await options.transaction.set(doc, data, {merge: true})
            } else {
                await doc.set(data, {merge: true});
            }

            return model;
        } catch (e) {
            console.error("failed to save firestore document", e);
            throw e;
        }
    }

    async getById<T extends BaseModel>(id: string, Type: { new(): T }, options: GetOptions = DefaultGetOptions): Promise<T | undefined> {
        const type = new Type();

        const collection = this.getCollectionRef(type.collection);

        const docRef = collection.doc(id);
        let doc;
        if (options.transaction) {
            doc = await options.transaction.get(docRef)
        } else {
            doc = await docRef.get();
        }

        if (!doc) {
            return;
        }

        if (!options.includeDeleted && doc.get("deleted") === true) {
            console.warn("Document is deleted, and the request options did not include deleted objects");
            return;
        }

        return fromDocumentSnapshot(doc, Type);
    }


    async getFirst<T extends BaseModel>(query: FirebaseFirestore.Query, Type: { new(): T }, options: QueryOptions = DefaultQueryOptions): Promise<T | undefined> {
        const startTime = new Date().getTime();

        const response = await this.executeQuery(query.limit(1), Type, options);
        const endTime = new Date().getTime();
        console.log(`getFirst query finished after ${endTime - startTime}ms`);
        const [first] = response.results;
        return first;
    }

    async executeQuery<T extends BaseModel>(originalQuery: FirebaseFirestore.Query, Type: { new(): T }, options: QueryOptions = DefaultQueryOptions): Promise<QueryResult<T>> {
        try {
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

            let snapshot;
            if (options.transaction) {
                snapshot = await options.transaction.get(query)

            } else {
                snapshot = await query.get();
            }
            const size = snapshot.size;
            const results: T[] = fromQuerySnapshot(snapshot, Type);
            const queryResult: QueryResult<T> = {results, size};
            if (snapshot.docs.length > 0) {
                queryResult.lastCursor = snapshot.docs[snapshot.docs.length - 1];
            }

            return queryResult;
        } catch (e) {
            console.error(`Failed to execute query ${options.queryName || ""}`.trim(), e);
            Sentry.captureException(e);
            await AdminSlackService.getSharedInstance().sendEngineeringMessage(`Failed to execute query. Error\n\`\`\`${e}\`\`\``);
            return {size: 0, results: [], error: e};
        }

    }

    async executeBatchedQuery<T extends BaseModel>(options: {
        query: FirebaseFirestore.Query,
        type: { new(): T }
        batchSize?: number,
        onData: (sentPrompts: T[], batchNumber: number) => Promise<void>,
        orderBy?: string,
        sortDirection?: QuerySortDirection,
    }) {
        const {query, type} = options;
        let batchNumber = 0;
        let results = await this.executeQuery(query, type, {
            pagination: {
                limit: options.batchSize || DEFAULT_BATCH_SIZE,
                sortDirection: options.sortDirection || QuerySortDirection.asc,
                orderBy: options.orderBy || BaseModelField.createdAt,
            }
        });
        console.log(`Fetched ${results.size} sentPrompts in batch ${batchNumber}`);
        await options.onData(results.results, 0);
        while (results.results.length > 0 && results.lastCursor) {
            batchNumber++;
            results = await this.executeQuery(query, type, {
                pagination: {
                    startAfter: results.lastCursor,
                    limit: options.batchSize || DEFAULT_BATCH_SIZE,
                    orderBy: options.orderBy || BaseModelField.createdAt,
                    sortDirection: options.sortDirection || QuerySortDirection.asc,
                }
            });
            console.log(`Fetched ${results.size} results in batch ${batchNumber}`);
            await options.onData(results.results, batchNumber);
        }
    }

    async delete<T extends BaseModel>(id: string, Type: { new(): T }): Promise<T | undefined> {
        const model = await this.getById(id, Type);
        return this.deleteModel(model);
    }

    async deleteModel<T extends BaseModel>(model?: T): Promise<T | undefined> {
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

    async deletePermanently<T extends BaseModel>(model: T): Promise<T | undefined> {
        if (!model.id) {
            return
        }
        const collection = this.getCollectionRefFromModel(model);

        const doc = collection.doc(model.id);
        await doc.delete();
        console.log(`Deleted ${model.collection}.${model.id} from the database`);
        return model
    }


    async deletePermanentlyForQuery<T extends BaseModel>(query: FirebaseFirestore.Query): Promise<number> {
        const snapshot = await query.get();
        const tasks = snapshot.docs.map(doc => {
            return doc.ref.delete()
        });

        const results = await Promise.all(tasks);
        console.log(`Permanently Deleted ${results.length} documents`);
        return results.length

    }

    async deleteForQuery<T extends BaseModel>(query: FirebaseFirestore.Query, Type: { new(): T }): Promise<(T | undefined)[]> {
        const results = await this.executeQuery(query, Type);
        const deletedModels = await Promise.all(results.results.map(this.deleteModel));
        console.log(`deleted ${deletedModels.length} models`);
        return deletedModels;
    }
}


