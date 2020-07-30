import { EventAction, FlamelinkWebhookEvent, ModuleType } from "@shared/types/FlamelinkWebhookTypes";
import { SchemaName } from "@shared/FlamelinkModel";
import PromptContent from "@shared/models/PromptContent";
import AdminUserService from "@admin/services/AdminUserService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import Logger from "@shared/Logger";

const logger = new Logger("WebhookHandler");

export interface WebhookEventResult {
    success: boolean,
    message?: string,
    error?: any,
}


function parseEventType(eventType: string): { module: ModuleType, action: EventAction } {
    const [module, action] = eventType.split(".");
    return {
        module: module as ModuleType, action: action as EventAction
    }
}


export async function handleWebhookEvent(event: FlamelinkWebhookEvent, eventType: string): Promise<WebhookEventResult> {
    logger.log("Handing webhook event for type", eventType);
    const {module, action} = parseEventType(eventType);

    switch (module) {
        case ModuleType.content:
            return handleContentEvent(event, action);
        default:
            logger.error(`Module ${module} is not handled`);
            return {success: false, message: `No handler Module "${module}" was found.`};
    }
}

async function handleContentEvent(event: FlamelinkWebhookEvent, action: EventAction): Promise<WebhookEventResult> {
    const schema = getContentSchema(event);
    if (!schema) {
        return {success: false, message: `No schema was found in the payload`}
    }

    switch (schema) {
        case SchemaName.promptContent:
            return handlePromptContentEvent(event, action);
            break;
        default:
            return {success: false, message: `No handler is available for schema ${schema}. `}
    }
}

async function handlePromptContentEvent(event: FlamelinkWebhookEvent, action: EventAction): Promise<WebhookEventResult> {
    try {
        logger.log(`Handing prompt content ${action}`);

        const {_fl_meta_: meta} = event.data;
        const promptContent = new PromptContent(event.data);
        logger.log("Prompt content is", JSON.stringify(promptContent, null, 2));
        const updatedUserId = meta ? meta.lastModifiedBy : undefined;
        const updatedUser = await AdminUserService.getSharedInstance().getById(updatedUserId);
        if (updatedUser) {
            logger.log(`Updated by ${updatedUser.email}`);
        }


        const promptFromDb = await AdminPromptContentService.getSharedInstance().getByEntryId(promptContent.entryId);
        logger.log("fetched prompt from db using service class:", JSON.stringify(promptFromDb, null, 2));

        return {success: true, message: "Not yet implemented"}
    } catch (error) {
        logger.error("Failed to handle Prompt Content event", error);
        return {success: false, message: "Unexpected Error", error,}
    }

}

function getContentSchema(event: FlamelinkWebhookEvent): SchemaName | undefined {
    const data = event.data;
    if (!data || !data._fl_meta_) {
        return;
    }

    const meta = data._fl_meta_;
    return meta.schema;
}

