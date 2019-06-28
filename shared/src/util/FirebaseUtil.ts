
import {isDate, isNotNull, transformObjectSync} from "@shared/util/ObjectUtil";
import {BaseModel} from "@shared/FirestoreBaseModels";
import * as admin from "firebase-admin";
import QuerySnapshot = admin.firestore.QuerySnapshot;


let TimestampClass:TimestampInterface|any;

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

export function setTimestamp(timestamp:any){
    TimestampClass = timestamp;
}

export type DocumentData = { [field: string]: any };

export interface DocumentSnapshot {
    data(): DocumentData|undefined;
    readonly id: string;
    readonly exists: boolean;
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
        if (isNotNull(value) && value instanceof TimestampClass) {
            return value.toDate();
        }
        return value;
    })
}

export function fromDocumentSnapshot<T extends BaseModel>(doc:DocumentSnapshot, Type: {new(): T}): T|null {
    if (!doc.exists){
        return null;
    }

    const data = doc.data();
    if (!data){
        return null;
    }
    data.id = doc.id;

    return fromFirestoreData(data, Type);
}

export function fromQuerySnapshot<T extends BaseModel>(snapshot: QuerySnapshot, Type: {new(): T}): T[] {
    const results:T[] = [];

    if (snapshot.empty){
        return results;
    }

    snapshot.forEach(doc => {
        const model = fromDocumentSnapshot(doc, Type);
        if (model){
            results.push(model);
        } else {
            console.warn("Unable to decode model", Type);
        }
    });
    return results;
}

export function fromFirestoreData<T extends BaseModel>(data: any, Type: { new(): T }): T {
    const transformed = convertTimestampToDate(data);
    const model = new Type();
    return Object.assign(model, transformed) as T;
}

export function fromJSON<T extends BaseModel>(json:any, Type: {new(): T}):T{
    const model = new Type();
    model.decodeJSON(json);
    return model;
}