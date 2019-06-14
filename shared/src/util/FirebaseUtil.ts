import * as firebase from "firebase"
import {isDate, isNotNull, transformObject} from "@shared/util/ObjectUtil";
import Timestamp = firebase.firestore.Timestamp;
import {BaseModel} from "@shared/models/FirestoreBaseModels";
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;

export async function convertDateToTimestamp(input: any): Promise<any> {
    const copy = Object.assign({}, input);

    return await transformObject(copy, (value) => {
        if (isDate(value)) {
            return firebase.firestore.Timestamp.fromDate(value);
        }
        return value;
    })
}

export async function convertTimestampToDate(input: any): Promise<any> {
    const copy = Object.assign({}, input);

    return await transformObject(copy, (value) => {
        if (isNotNull(value) && value instanceof Timestamp) {
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
    let transformed = await convertTimestampToDate(data);
    const model = new Type();
    return Object.assign(model, transformed) as T;
}