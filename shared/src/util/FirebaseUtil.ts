
import {isDate, isNotNull, transformObject} from "@shared/util/ObjectUtil";
import {BaseModel} from "@shared/FirestoreBaseModels";


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

export async function convertDateToTimestamp(input: any): Promise<any> {
    const copy = Object.assign({}, input);

    return await transformObject(copy, (value) => {
        if (isDate(value)) {
            return TimestampClass.fromDate(value);
        }
        return value;
    })
}

export async function convertDateToJSON(input: any): Promise<any> {
    const copy = Object.assign({}, input);

    return await transformObject(copy, (value) => {
        if (isDate(value)) {
            return (value as Date).getTime();
        }
        return value;
    })
}

export async function convertTimestampToDate(input: any): Promise<any> {
    const copy = Object.assign({}, input);

    return await transformObject(copy, (value) => {
        if (isNotNull(value) && value instanceof TimestampClass) {
            return value.toDate();
        }
        return value;
    })
}

export async function fromDocumentSnapshot<T extends BaseModel>(doc:DocumentSnapshot, Type: {new(): T}): Promise<T|null> {
    const data = doc.data();
    if (!data){
        return null;
    }
    data.id = doc.id;

    return fromFirestoreData(data, Type);
}

export async function fromFirestoreData<T extends BaseModel>(data: any, Type: { new(): T }): Promise<T> {
    const transformed = await convertTimestampToDate(data);
    const model = new Type();
    return Object.assign(model, transformed) as T;
}

export function fromJSON<T extends BaseModel>(json:any, Type: {new(): T}):T{
    const model = new Type();
    model.decodeJSON(json);
    return model;
}