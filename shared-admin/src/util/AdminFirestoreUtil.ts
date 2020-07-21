import { Change } from "firebase-functions";
import { DocumentSnapshot } from "@admin/services/AdminFirestoreService";
import { isNull } from "@shared/util/ObjectUtil";

export interface IChange<T> {
    before?: T|null,
    after?: T|null,
}

export type AnyChange = IChange<any>;

export enum ChangeType {
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    DELETED = "DELETED",
}

export function getDocumentChangeType(change: Change<DocumentSnapshot>): ChangeType {
    if (!change.after.exists) {
        return ChangeType.DELETED
    }

    if (change.before.exists) {
        return ChangeType.UPDATED
    }

    return ChangeType.CREATED;
}

export function getChangeType(change: AnyChange): ChangeType {
    if (isNull(change.after)) {
        return ChangeType.DELETED
    }

    if (!isNull(change.before)) {
        return ChangeType.UPDATED
    }

    return ChangeType.CREATED;
}