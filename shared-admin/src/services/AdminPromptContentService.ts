import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import PromptContent from "@shared/models/PromptContent";
import {SchemaName} from "@shared/FlamelinkModel";
import {CactusElement} from "@shared/models/CactusElement";
import {getDateAtMidnightDenver, getFlamelinkDateString, plusDays} from "@shared/util/DateUtil";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";


export default class AdminPromptContentService {
    protected static sharedInstance: AdminPromptContentService;

    flamelinkService: AdminFlamelinkService;
    schema = SchemaName.promptContent;

    static getSharedInstance(): AdminPromptContentService {
        if (!AdminPromptContentService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminPromptContentService before using it");
        }
        return AdminPromptContentService.sharedInstance;
    }

    static initialize() {
        AdminPromptContentService.sharedInstance = new AdminPromptContentService();
    }

    constructor() {
        this.flamelinkService = AdminFlamelinkService.getSharedInstance();
    }

    async save(model: PromptContent): Promise<PromptContent | undefined> {
        return this.flamelinkService.save(model);
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

    async getPromptContentForDate(date: Date = new Date()): Promise<PromptContent | undefined> {
        try {
            const midnightDenver = getDateAtMidnightDenver(date);
            const nextDate = plusDays(1, midnightDenver);
            const startDateString = getFlamelinkDateString(nextDate);
            const endDateString = getFlamelinkDateString(midnightDenver);

            console.log("start date", startDateString);
            console.log("end date", endDateString);
            const raw = await this.flamelinkService.content.get({
                schemaKey: SchemaName.promptContent,
                // field: PromptContent.Fields.scheduledSendAt,
                orderBy: {field: PromptContent.Fields.scheduledSendAt, order: "desc"},
                startAt: startDateString,
                endAt: endDateString,
            });

            if (!raw) {
                console.warn("AdminPromptContentService.getPromptContentForDate: No objects found for dates given");
                return
            }

            const allValues = Object.values(raw);
            console.log(`Found ${allValues.length} that matched the criteria for the date range`);
            const [content]: (any | undefined)[] = allValues;
            if (!content) {
                return undefined
            }

            return fromFlamelinkData(content, PromptContent);
        } catch (error) {
            console.error("Failed to fetch content", error);
            return undefined;
        }

    }
}