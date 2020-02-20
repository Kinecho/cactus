import {isDate, isNotNull, transformObjectSync} from "@shared/util/ObjectUtil";
import {BaseModel} from "@shared/FirestoreBaseModels";
import Logger from "@shared/Logger";

const logger = new Logger("FirestoreUti.ts");
let TimestampClass: TimestampInterface | any;

export interface TimestampInterface {
    fromMillis<T extends TimestampInterface>(milliseconds: number): T;

    fromDate(date: Date): TimestampInterface;

    now(): TimestampInterface;

    seconds: number;
    nanoseconds: number;

    toDate(): Date;

    toMillis(): number;

    isEqual(other: TimestampInterface): boolean;
}

export function isTimestamp(value: any): boolean {
    return isNotNull(value) && (value instanceof TimestampClass || (value.seconds && value.nanoseconds))
}

export function toTimestamp(date: Date): TimestampInterface {
    return TimestampClass.fromDate(date);
}

export function timestampToDate(timestamp: any): Date | undefined {
    if (isTimestamp(timestamp)) {
        if (timestamp.toDate) {
            return timestamp.toDate();
        } else if (timestamp.hasOwnProperty("seconds") && timestamp.hasOwnProperty("nanoseconds")) {
            return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds / 1000000));
        }
    }
    return;
}

export function setTimestamp(timestamp: any) {
    TimestampClass = timestamp;
}

export type DocumentData = { [field: string]: any };

export interface DocumentSnapshot {
    data(options?: SnapshotOptions): DocumentData | undefined;

    readonly id: string;
    readonly exists: boolean;
}

export interface SnapshotOptions {
    readonly serverTimestamps?: 'estimate' | 'previous' | 'none';
}

export interface QueryDocumentSnapshot extends DocumentSnapshot {
    data(options?: SnapshotOptions): DocumentData
}

export interface QuerySnapshot {
    docs: QueryDocumentSnapshot[],
    size: number
    empty: boolean,

    forEach(callback: (doc: DocumentSnapshot) => void): void,

    isEqual(other: QuerySnapshot): boolean,
}

export function convertDateToTimestamp(input: any): any {
    const copy = Object.assign({}, input);

    return transformObjectSync(copy, (value) => {
        if (isDate(value)) {
            return TimestampClass.fromDate(value);
        }
        return value;
    })
}

export function convertDateToJSON(input: any): any {
    const copy = Object.assign({}, input);

    return transformObjectSync(copy, (value) => {
        if (isDate(value)) {
            return (value as Date).getTime();
        }
        return value;
    })
}

export function convertTimestampToDate(input: any): any {
    const copy = Object.assign({}, input);

    return transformObjectSync(copy, (value) => {
        if (isTimestamp(value)) {
            return timestampToDate(value);
        }

        return value;
    })
}

export function fromQueryDocumentSnapshot<T extends BaseModel>(doc: QueryDocumentSnapshot, Type: { new(): T }, options?: SnapshotOptions): T | undefined {
    if (!doc.exists) {
        return;
    }

    const data = doc.data(options);
    if (!data) {
        return;
    }
    data.id = doc.id;

    return fromFirestoreData(data, Type);
}

export function fromDocumentSnapshot<T extends BaseModel>(doc: DocumentSnapshot, Type: { new(): T }, options?: SnapshotOptions): T | undefined {
    if (!doc.exists) {
        return;
    }

    const data = doc.data(options);
    if (!data) {
        return;
    }
    data.id = doc.id;

    return fromFirestoreData(data, Type);
}

export function fromQuerySnapshot<T extends BaseModel>(snapshot: QuerySnapshot, Type: { new(): T }): T[] {
    const results: T[] = [];

    if (snapshot.empty) {
        return results;
    }

    snapshot.forEach((doc: DocumentSnapshot) => {
        const model = fromDocumentSnapshot(doc, Type);
        if (model) {
            results.push(model);
        } else {
            logger.warn("Unable to decode model", Type);
        }
    });
    return results;
}

export function fromFirestoreData<T extends BaseModel>(data: any, Type: { new(): T }): T {
    logger.info("FromFirestoreData | rawData: ", data);
    logger.info("FromFirestoreData | rawData.subscription.trial.startedAt = : ", data?.subscription?.trial?.startedAt);
    logger.info("FromFirestoreData | rawData.subscription.trial.startedAt typeof : ", typeof (data?.subscription?.trial?.startedAt));
    const transformed = convertTimestampToDate(data);

    logger.info("FromFirestoreData | transformed: ", transformed);
    logger.info("FromFirestoreData | transformed.subscription.trial.startedAt = : ", transformed?.subscription?.trial?.startedAt);
    logger.info("FromFirestoreData | transformed.subscription.trial.startedAt typeof : ", typeof (transformed?.subscription?.trial?.startedAt));

    const model = new Type();
    const t = Object.assign(model, transformed) as T;
    t.prepareFromFirestore(data);

    return t;
}

export function fromJSON<T extends BaseModel>(json: any, Type: { new(): T }): T {
    const model = new Type();
    model.decodeJSON(json);
    return model;
}