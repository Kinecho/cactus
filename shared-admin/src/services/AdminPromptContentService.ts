import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import {SchemaName} from "@shared/FlamelinkModel";
import {CactusElement} from "@shared/models/CactusElement";
import {fromFlamelinkData, getPromptContentForDateQueryOptions} from "@shared/util/FlamelinkUtils";
import {DateObject} from "luxon";
import AdminSlackService from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";
import {CactusConfig} from "@shared/CactusConfig";

const logger = new Logger("AdminPromptContentService");


export default class AdminPromptContentService {
    protected static sharedInstance: AdminPromptContentService;
    config: CactusConfig;
    flamelinkService: AdminFlamelinkService;
    schema = SchemaName.promptContent;

    static getSharedInstance(): AdminPromptContentService {
        if (!AdminPromptContentService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminPromptContentService before using it");
        }
        return AdminPromptContentService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        AdminPromptContentService.sharedInstance = new AdminPromptContentService(config);
    }

    constructor(config: CactusConfig) {
        this.flamelinkService = AdminFlamelinkService.getSharedInstance();
        this.config = config;
    }

    async save(model: PromptContent): Promise<PromptContent | undefined> {
        logger.log("[AdminPromptContentService.save] Saving prompt content with scheduledSendAt = ", model.scheduledSendAt);
        const saved = await this.flamelinkService.save(model);
        logger.log("[AdminPromptContentService.save] Saved prompt content with scheduledSendAt = ", saved?.scheduledSendAt);
        return saved;
    }

    async getByEntryId(id?: string): Promise<PromptContent | undefined> {
        if (!id) {
            return undefined;
        }
        return await this.flamelinkService.getByEntryId(id, PromptContent);
    }

    async getByPromptId(promptId?: string): Promise<PromptContent | undefined> {
        if (!promptId) {
            return undefined;
        }

        return await this.flamelinkService.getByField({
            name: PromptContent.Fields.promptId,
            value: promptId
        }, PromptContent)
    }

    async setCactusElement(content: PromptContent, element: CactusElement): Promise<void> {
        // const {promptId, element} = options;

        return this.flamelinkService.update(content, {[PromptContent.Fields.cactusElement]: element})
    }

    async getAll(): Promise<PromptContent[]> {
        const results = await this.flamelinkService.getAll(PromptContent);
        return results.results;
    }

    async getPromptContentForDate(options: { systemDate?: Date, dateObject?: DateObject, status?: ContentStatus, }): Promise<PromptContent | undefined> {
        try {
            const getOptions = getPromptContentForDateQueryOptions(options);
            if (!getOptions) {
                logger.error("Unable to get prompt content options for dates");
                return;
            }
            const raw = await this.flamelinkService.content.get(getOptions);

            if (!raw) {
                logger.warn("AdminPromptContentService.getPromptContentForDate: No objects found for dates given");
                return;
            }

            const allValues = Object.values(raw);
            logger.log(`Found ${allValues.length} that matched the criteria for the date range`);
            const [content]: (any | undefined)[] = allValues;
            if (!content) {
                return undefined;
            }

            return fromFlamelinkData(content, PromptContent);
        } catch (error) {
            logger.error("Failed to fetch content", error);
            await AdminSlackService.getSharedInstance().sendEngineeringMessage(this.config.app.serverName + ` | getPromptContentForDate():  Failed to execute query for Flamelink content. Error\n\`\`\`${error}\`\`\`\nOptions\n\`\`\`${options}\`\`\``);
            return undefined;
        }
    }
}