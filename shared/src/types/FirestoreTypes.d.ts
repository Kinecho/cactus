import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";

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
    collectionIds?:string[],
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