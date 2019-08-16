import {FlamelinkData, SchemaName} from "@shared/FlamelinkModel";

export interface FlamelinkTimestamp {
    _seconds: number,
    _nanoseconds: number,
}


export interface FlamelinkContentMeta {
    createdBy: string,
    lastModifiedDate: FlamelinkTimestamp,
    lastModifiedBy: string,
    locale: string,
    createdDate: FlamelinkTimestamp,
    fl_id: string,
    env: string,
    docId: string,
    schemaType: string,
    schemaRef: any,
    schema: SchemaName,
}


export interface FlamelinkWebhookEvent {
    id: string,
    created: number,
    livemode: boolean,
    projectId: string,
    url: string,
    method: string,
    data: FlamelinkData,
    webhookId: string,
}

export enum ModuleType {
    content = "content",
    schemas = "schemas",
    backups = "backups",
    environmemnts = "environments",
    files = "files",
    folders = "folders",
    languages = "languages",
    navigation = "navigation",
    permissions = "permissions",
    users = "users",
    webhooks = "webhooks",
    workflows = "workflows",
}

export enum EventAction {
    create = "create",
    update = "update",
    delete = "delete",
}