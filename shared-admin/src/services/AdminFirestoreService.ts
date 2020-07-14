import * as firebaseAdmin from "firebase-admin";
import { BaseModel, BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import { fromDocumentSnapshot, fromQuerySnapshot } from "@shared/util/FirestoreUtil";
import { FirestoreErrorCode, IGetOptions, IQueryOptions, QueryResult } from "@shared/types/FirestoreTypes";
import * as Sentry from "@sentry/node"
import AdminSlackService from "@admin/services/AdminSlackService";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import Logger from "@shared/Logger";
import { CactusConfig } from "@admin/CactusConfig";
export import DocumentReference = firebaseAdmin.firestore.DocumentReference;
export import DocumentSnapshot = firebaseAdmin.firestore.DocumentSnapshot;
export import Timestamp = firebaseAdmin.firestore.Timestamp;
export import Transaction = firebaseAdmin.firestore.Transaction;
export import Batch = firebaseAdmin.firestore.WriteBatch;
export import CollectionReference = firebaseAdmin.firestore.CollectionReference;
export import FieldValue = firebaseAdmin.firestore.FieldValue;
import { isNull } from "@shared/util/ObjectUtil";
import { isBlank } from "@shared/util/StringUtil";

export type QueryCursor = string | number | DocumentSnapshot | Timestamp | any;

const logger = new Logger("AdminFirestoreService");

export interface QueryOptions extends IQueryOptions<QueryCursor> {
    transaction?: Transaction,
    silentErrorCodes?: FirestoreErrorCode[],
}

export interface GetOptions extends IGetOptions {
    transaction?: Transaction,
    silentErrorCodes?: FirestoreErrorCode[],
    throwOnError?: boolean,
}

export interface GetBatchOptions<T extends BaseModel> extends GetOptions {
    batchSize?: number,
    maxBatches?: number,
    onData: (models: T[], batchNumber: number) => Promise<void>
}

export interface DeleteOptions {
    transaction?: Transaction
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
    transaction?: Transaction,
    queryName?: string,
    batch?: Batch,
}


export const DEFAULT_SAVE_OPTIONS: SaveOptions = {
    setUpdatedAt: true,
    transaction: undefined,
    batch: undefined,
};

export function getDefaultOptions(): SaveOptions {
    return { ...DEFAULT_SAVE_OPTIONS }
}

export const DEFAULT_BATCH_SIZE = 500;

export default class AdminFirestoreService {
    admin: firebaseAdmin.app.App;
    firestore: FirebaseFirestore.Firestore;
    config: CactusConfig;
    static Timestamp = Timestamp;
    static _dbInitialized: boolean = false

    protected static sharedInstance: AdminFirestoreService;

    static getSharedInstance(): AdminFirestoreService {
        if (!AdminFirestoreService.sharedInstance) {
            throw new Error("No shared AdminFirestoreService instance is available. Ensure you have called the initialize() function before using the shared instance")
        }
        return AdminFirestoreService.sharedInstance;
    }

    static initialize(app: firebaseAdmin.app.App, config: CactusConfig) {
        logger.log("Initializing firestore service");
        AdminFirestoreService.sharedInstance = new AdminFirestoreService(app, config);
    }

    constructor(admin: firebaseAdmin.app.App, config: CactusConfig) {
        this.admin = admin;

        this.firestore = admin.firestore();
        if (!AdminFirestoreService._dbInitialized) {
            this.firestore.settings({ ignoreUndefinedProperties: true });
            AdminFirestoreService._dbInitialized = true
        }

        this.config = config;
    }

    getCollectionRef(collectionName: Collection) {
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
    async runTransaction(updateFunction: (transaction: Transaction) => Promise<any>, options?: { maxAttempts: number | undefined }): Promise<any> {
        return this.firestore.runTransaction(async t => {
            return await updateFunction(t);
        }, options)
    }

    getBatch(): Batch {
        return this.firestore.batch();
    }

    async save<T extends BaseModel>(model: T, opts: SaveOptions = DEFAULT_SAVE_OPTIONS): Promise<T> {
        try {
            const options = { ...DEFAULT_SAVE_OPTIONS, ...opts };
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
            // logger.log("Data to save:", JSON.stringify(data));
            if (options.transaction) {
                await options.transaction.set(doc, data, { merge: true })
            } else if (options.batch) {
                await options.batch.set(doc, data, { merge: true })
            } else {
                await doc.set(data, { merge: true });
            }

            return model;
        } catch (e) {
            const msgBase = `[${ this.config.app.serverName || "unknown_server" }] failed to save firestore document ${ model.id } to collection ${ model.collection }. ${ opts.transaction ? "Using transaction." : "" }`;
            logger.error(msgBase, e);
            await AdminSlackService.getSharedInstance().sendDbAlertsMessage(`${ msgBase }\n\`\`\`${ e }\`\`\``);
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
            logger.warn("Document is deleted, and the request options did not include deleted objects");
            return;
        }

        return fromDocumentSnapshot(doc, Type);
    }


    async getFirst<T extends BaseModel>(query: FirebaseFirestore.Query, Type: { new(): T }, options: QueryOptions = DefaultQueryOptions): Promise<T | undefined> {
        const response = await this.executeQuery(query.limit(1), Type, options);
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
            const queryResult: QueryResult<T> = { results, size };
            if (snapshot.docs.length > 0) {
                queryResult.lastCursor = snapshot.docs[snapshot.docs.length - 1];
            }

            return queryResult;
        } catch (e) {
            const messageParts: string [] = []
            if (!isBlank(this.config.app.serverName)) {
                messageParts.push(`\`[${ this.config.app.serverName }]\``);
            }
            messageParts.push(`An error occurred while executing a query${ options.transaction ? " while using a transaction." : "." }`);
            if (options.queryName) {
                messageParts.push(`\nQueryName: \`${ options.queryName }\``);
            }

            messageParts.push(`\n\`\`\`${ e }\`\`\``);
            const errorMessage = messageParts.join(" ");
            if (!(options.silentErrorCodes?.includes(error.code) ?? false)) {
                logger.error(errorMessage, e);
                Sentry.captureException(e);
                await AdminSlackService.getSharedInstance().sendDbAlertsMessage(errorMessage);
            }

            return { size: 0, results: [], error: e };
        }

    }

    async executeBatchedQuery<T extends BaseModel>(options: {
        query: FirebaseFirestore.Query,
        type: { new(): T }
        batchSize?: number,
        onData: (models: T[], batchNumber: number) => Promise<void>,
        orderBy?: string,
        maxBatches?: number,
        sortDirection?: QuerySortDirection,
        includeDeleted?: boolean
    }) {
        const { query, type, includeDeleted, maxBatches } = options;
        let batchNumber = 0;

        let results = await this.executeQuery(query, type, {
            includeDeleted,
            pagination: {
                limit: options.batchSize || DEFAULT_BATCH_SIZE,
                sortDirection: options.sortDirection || QuerySortDirection.asc,
                orderBy: options.orderBy || BaseModelField.createdAt,
            }
        });
        logger.log(`Fetched ${ results.size } items in batch ${ batchNumber }`);
        await options.onData(results.results, 0);
        while (results.results.length > 0 && results.lastCursor && (isNull(maxBatches) || maxBatches && batchNumber < maxBatches)) {
            batchNumber++;
            results = await this.executeQuery(query, type, {
                includeDeleted,
                pagination: {
                    startAfter: results.lastCursor,
                    limit: options.batchSize || DEFAULT_BATCH_SIZE,
                    orderBy: options.orderBy || BaseModelField.createdAt,
                    sortDirection: options.sortDirection || QuerySortDirection.asc,
                }
            });
            logger.log(`Fetched ${ results.size } results in batch ${ batchNumber }`);
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
            logger.warn("Model is already deleted. Not performing any action");
        } else {
            logger.warn("No object found for given id. Not deleting anything.");
        }

        return model;
    }

    async deletePermanently<T extends BaseModel>(model: T, options?: DeleteOptions): Promise<T | undefined> {
        if (!model.id) {
            return
        }
        const collection = this.getCollectionRefFromModel(model);

        const doc = collection.doc(model.id);
        if (options?.transaction) {
            options.transaction.delete(doc);
        } else {
            await doc.delete();
        }

        logger.log(`Deleted ${ model.collection }.${ model.id } from the database`);
        return model
    }


    async deletePermanentlyForQuery<T extends BaseModel>(query: FirebaseFirestore.Query, options?: DeleteOptions): Promise<number> {
        let snapshot;
        if (options?.transaction) {
            snapshot = await options.transaction.get(query)
        } else {
            snapshot = await query.get();
        }

        const tasks: Promise<any>[] = snapshot.docs.map(doc => {
            if (options?.transaction) {
                options?.transaction?.delete(doc.ref);
                return Promise.resolve(1)
            }
            return doc.ref.delete()
        });

        const results = await Promise.all(tasks);
        logger.log(`Permanently Deleted ${ results.length } documents`);
        return results.length

    }

    async deleteForQuery<T extends BaseModel>(query: FirebaseFirestore.Query, Type: { new(): T }): Promise<(T | undefined)[]> {
        const results = await this.executeQuery(query, Type);
        const deletedModels = await Promise.all(results.results.map(this.deleteModel));
        logger.log(`deleted ${ deletedModels.length } models`);
        return deletedModels;
    }
}


