import { ISODate } from "@shared/mailchimp/models/MailchimpTypes";
import { BaseModel } from "@shared/FirestoreBaseModels";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import { DocumentSnapshot } from "@shared/util/FirestoreUtil";

export enum OperationState {
    SUCCESSFUL = "SUCCESSFUL",
    PROCESSING = "PROCESSING",
}

export interface ProgressWork {
    estimatedWork: string,
    completedWork: string,
}

export interface OperationMetadata {
    "@type": string,
    startTime?: ISODate,
    endTime: ISODate,
    operationState: OperationState,
    progressDocuments?: ProgressWork,
    progressBytes?: ProgressWork,
    collectionIds?: string[],
    outputUriPrefix: string,
}

export interface Operation {
    name: string,
    metadata: OperationMetadata,
    done?: boolean,
    response?: {
        "@type"?: string
    }
}

/**
 * See [GRPC Errors](https://github.com/grpc/grpc/blob/master/doc/statuscodes.md) for more details
 */
export enum FirestoreErrorCode {
    OK = 0,
    /**
     * The operation was cancelled, typically by the caller.
     */
    CANCELLED = 1,
    UNKNOWN = 2,
    INVALID_ARGUMENT = 3,
    DEADLINE_EXCEEDED = 4,
    NOT_FOUND = 5,
    ALREADY_EXISTS = 6,
    PERMISSION_DENIED = 7,
    UNAUTHENTICATED = 16,
    RESOURCE_EXHAUSTED = 8,
    FAILED_PRECONDITION = 9,
    /**
     * The operation was aborted, typically due to a concurrency issue such as a sequencer
     * check failure or transaction abort.See the guidelines above for deciding between
     * FAILED_PRECONDITION, ABORTED, and UNAVAILABLE.
     */
    ABORTED = 10,
    OUT_OF_RANGE = 11,
    UNIMPLEMENTED = 12,
    INTERNAL = 13,
    UNAVAILABLE = 14,
    DATA_LOSS = 15,
}

export interface IGetOptions {
    queryName?: string,
    includeDeleted?: boolean,
    onlyDeleted?: boolean,
}

export interface DocObserverOptions<IModel extends BaseModel> extends IGetOptions {
    queryName?: string,
    onData: (model?: IModel, error?: any) => void | Promise<void>
}

export interface IQueryOptions<IQueryCursor> extends IGetOptions {
    pagination?: {
        startAt?: IQueryCursor,
        startAfter?: IQueryCursor,
        endAt?: IQueryCursor,
        endBefore?: IQueryCursor,
        orderBy: string,
        sortDirection: QuerySortDirection,
        limit: number,
    }
}

export interface IQueryObserverOptions<IQueryCursor, IModel extends BaseModel> extends IQueryOptions<IQueryCursor> {
    onModified?: (model: IModel) => void | Promise<void>,
    onRemoved?: (removed: IModel) => void | Promise<void>,
    onAdded?: (added: IModel) => void | Promise<void>,
    onData: (models: IModel[]) => void | Promise<void>,
    queryName?: string,
}

export interface QueryResult<T> {
    results: T[],
    size: number,
    error?: any,
    lastCursor?: any | undefined,
}

export interface IPageResult<T extends BaseModel, S extends DocumentSnapshot> {
    error?: any,
    results: T[],
    firstSnapshot?: S,
    lastSnapshot?: S,
    pageSize?: number,
    mightHaveMore: boolean,
}

export interface IPageListenerResult<T extends BaseModel, S extends DocumentSnapshot> extends IPageResult<T, S> {
    added?: T[],
    removed?: T[],
    updated?: T[],
}