import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import {BaseModel} from "@shared/FirestoreBaseModels";

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


declare enum QuerySortDirection {
    desc = "desc",
    asc = "asc",
}

declare interface GetOptions {
    includeDeleted?: false,
    onlyDeleted?: false,
}


declare interface IQueryOptions<IQueryCursor> extends GetOptions {
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

declare interface QueryResult<T extends BaseModel> {
    results: T[],
    size: number,
}
