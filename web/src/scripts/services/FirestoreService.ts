// noinspection ES6UnusedImports
import * as firebaseClient from "firebase/app";
import CollectionReference = firebaseClient.firestore.CollectionReference;
import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import DocumentReference = firebaseClient.firestore.DocumentReference;
import DocumentSnapshot = firebaseClient.firestore.DocumentSnapshot;
import Timestamp = firebaseClient.firestore.Timestamp;
import {getFirestore} from "@web/firebase";
import {
    DocObserverOptions,
    IGetOptions,
    IQueryObserverOptions,
    IQueryOptions,
    QueryResult,
} from "@shared/types/FirestoreTypes";
import {fromDocumentSnapshot, fromQueryDocumentSnapshot, fromQuerySnapshot} from "@shared/util/FirestoreUtil";
import FieldValue = firebaseClient.firestore.FieldValue;
import {addModal, handleDatabaseError, showModal} from "@web/util";

export type Query = firebaseClient.firestore.Query;
export type QueryCursor = string | number | DocumentSnapshot | Timestamp;
export type QueryOptions = IQueryOptions<QueryCursor>;
export type GetOptions = IGetOptions
export type QueryObserverOptions<T extends BaseModel> = IQueryObserverOptions<QueryCursor, T>
export type ListenerUnsubscriber = () => void;

const DefaultGetOptions: GetOptions = {
    includeDeleted: false,
    onlyDeleted: false,
};

const DefaultQueryOptions: QueryOptions = {
    includeDeleted: false,
    onlyDeleted: false,
};

export default class FirestoreService {
    firestore: firebaseClient.firestore.Firestore = getFirestore();

    public static sharedInstance = new FirestoreService();

    getServerTimestamp(): FieldValue {
        return FieldValue.serverTimestamp();
    }

    getCurrentTimestamp(): Timestamp {
        return Timestamp.now();
    }

    getTimestampFromMilis(millis: number): Timestamp {
        return Timestamp.fromMillis(millis);
    }

    getTimestampFromDate(date: Date) {
        return Timestamp.fromDate(date);
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

    async save<T extends BaseModel>(model: T): Promise<T | undefined> {
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

            await doc.set(data, {merge: true});

            return model;
        } catch (e) {
            console.error("failed to save firestore document", e);
            if (e.code === "permission-denied") {

                handleDatabaseError({
                    title: "Whoops!",
                    message: "You do not have the proper permissions to perform this action.",
                    error: e
                })
            }
            return;
            // throw e;
        }
    }

    async getById<T extends BaseModel>(id: string, Type: { new(): T }, options: GetOptions = DefaultGetOptions): Promise<T | undefined> {
        const type = new Type();

        const collection = this.getCollectionRef(type.collection);

        const doc = await collection.doc(id).get();

        if (!doc) {
            return;
        }

        if (!options.includeDeleted && doc.get("deleted") === true) {
            console.warn("Document is deleted, and the request options did not include deleted objects");
            return;
        }

        return fromDocumentSnapshot(doc, Type);
    }

    async getFirst<T extends BaseModel>(originalQuery: Query, Type: { new(): T }): Promise<T | undefined> {
        const results = await this.executeQuery(originalQuery, Type);
        const [first] = results.results;
        return first;
    }

    observeFirst<T extends BaseModel>(originalQuery: Query, Type: { new(): T }, options: { onData: (result?: T | undefined) => void }): ListenerUnsubscriber {
        return this.observeQuery(originalQuery, Type, {
            onData: (results: T[]) => {
                const [first] = results;
                options.onData(first);
            }
        });
    }

    observeById<T extends BaseModel>(id: string, Type: { new(): T }, options: DocObserverOptions<T>): ListenerUnsubscriber {
        const type = new Type();

        const collection = this.getCollectionRef(type.collection);

        return collection.doc(id).onSnapshot(snapshot => {
            if (!options.includeDeleted && snapshot.get("deleted") === true) {
                console.warn("Document is deleted, and the request options did not include deleted objects", options.queryName);
                options.onData(undefined);
                return;
            }
            options.onData(fromDocumentSnapshot(snapshot, Type));
        }, error => {
            console.error(`there was an error fetching the document snapshot "${options.queryName || "unknown"}"`, error);
            options.onData(undefined, error)
        });
    }

    buildQuery<T extends BaseModel>(originalQuery: Query, options: QueryOptions = DefaultQueryOptions): Query {
        let query = originalQuery;

        if (options.includeDeleted === undefined) {
            options.includeDeleted = DefaultQueryOptions.includeDeleted;
        }

        if (options.onlyDeleted === undefined) {
            options.onlyDeleted = DefaultQueryOptions.onlyDeleted;
        }

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
        return query;
    }

    async executeQuery<T extends BaseModel>(originalQuery: Query, Type: { new(): T }, options: QueryOptions = DefaultQueryOptions): Promise<QueryResult<T>> {
        const query = this.buildQuery(originalQuery, options);
        try {
            const snapshot = await query.get();

            const size = snapshot.size;
            const results: T[] = fromQuerySnapshot(snapshot, Type);

            return {results, size};
        } catch (error) {
            console.error("Failed to execute query", error);
            if (error.message && error.message.indexOf("The query requires an index") !== -1) {
                addModal("index-needed", {title: "An index needs to be created", message: error.message});
                showModal("index-needed");
            }
            return {results: [], size: 0};
        }

    }

    observeQuery<T extends BaseModel>(originalQuery: Query, Type: { new(): T }, options: QueryObserverOptions<T>): ListenerUnsubscriber {
        const query = this.buildQuery(originalQuery, options);

        const allResults: T[] = [];
        return query.onSnapshot(snapshot => {
            if (snapshot.empty) {
                options.onData(allResults);
            }

            snapshot.docChanges().forEach(function (change) {
                if (!change || !change.doc) {
                    return;
                }

                const model: T | undefined = fromQueryDocumentSnapshot(change.doc, Type);
                if (!model) {
                    return;
                }

                if (change.type !== "added") {
                    if (change.type === "removed") {
                        allResults.splice(change.oldIndex, 1);
                        if (options.onRemoved) {
                            options.onRemoved(model);
                        }
                    }

                    if (change.type === "modified") {
                        if (change.newIndex >= 0) {
                            allResults.splice(change.newIndex, 1, model);
                        }
                        if (options.onModified) {
                            options.onModified(model);
                        }
                    }

                }
                if (change.type === "added") {
                    allResults.splice(change.newIndex, 0, model);
                    if (options.onAdded) {
                        options.onAdded(model);
                    }
                }
            });
            options.onData(allResults);
        }, error => {
            console.error("Error getting snapshot | queryName=" + options.queryName, error.message);
            if (error.message.includes("The query requires an index")) {
                addModal("index-needed", {title: "An index needs to be created", message: error.message});
                showModal("index-needed");
                // alert("The query requires and index\n\n" + error.message);
            }
        })
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


