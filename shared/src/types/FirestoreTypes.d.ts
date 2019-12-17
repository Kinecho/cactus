import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import {BaseModel} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import {DocumentSnapshot} from "@shared/util/FirestoreUtil";

declare enum OperationState {
    SUCCESSFUL = "SUCCESSFUL",
    PROCESSING = "PROCESSING",
}

declare interface ProgressWork {
    estimatedWork: string,
    completedWork: string,
}

declare interface OperationMetadata {
    "@type": string,
    startTime?: ISODate,
    endTime: ISODate,
    operationState: OperationState,
    progressDocuments?: ProgressWork,
    progressBytes?: ProgressWork,
    collectionIds?: string[],
    outputUriPrefix: string,
}

declare interface Operation {
    name: string,
    metadata: OperationMetadata,
    done?: boolean,
    response?: {
        "@type"?: string
    }
}

declare interface IGetOptions {
    queryName?: string,
    includeDeleted?: false,
    onlyDeleted?: false,
}

declare interface DocObserverOptions<IModel extends BaseModel> extends IGetOptions {
    queryName?:string,
    onData: (model?: IModel, error?: any) => void | Promise<void>
}

declare interface IQueryOptions<IQueryCursor> extends IGetOptions {
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

declare interface IQueryObserverOptions<IQueryCursor, IModel extends BaseModel> extends IQueryOptions<IQueryCursor> {
    onModified?: (model: IModel) => void | Promise<void>,
    onRemoved?: (removed: IModel) => void | Promise<void>,
    onAdded?: (added: IModel) => void | Promise<void>,
    onData: (models: IModel[]) => void | Promise<void>,
    queryName?: string,
}

declare interface QueryResult<T extends BaseModel> {
    results: T[],
    size: number,
    error?: any,
    lastCursor?: any|undefined,
}

declare interface IPageResult<T extends BaseModel, S extends DocumentSnapshot> {
    error?: any,
    results: T[],
    firstSnapshot?: S,
    lastSnapshot?: S,
    pageSize?: number,
    mightHaveMore: boolean,
}

declare interface IPageListenerResult<T extends BaseModel, S extends DocumentSnapshot> extends IPageResult<T, S> {
    added?: T[],
    removed?: T[],
    updated?: T[],
}