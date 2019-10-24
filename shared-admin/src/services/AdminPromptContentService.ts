import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import PromptContent from "@shared/models/PromptContent";
import {SchemaName} from "@shared/FlamelinkModel";
import {CactusElement} from "@shared/models/CactusElement";


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

    async getByPromptId(promptId?: string): Promise<PromptContent|undefined> {
        if (!promptId) {
            return undefined;
        }

        return await this.flamelinkService.getByField({name: PromptContent.Fields.promptId, value: promptId}, PromptContent)
    }

    async setCactusElement(content: PromptContent, element: CactusElement): Promise<void> {
        // const {promptId, element} = options;

        return this.flamelinkService.update(content, {[PromptContent.Fields.cactusElement]: element})
    }

    async getAll(): Promise<PromptContent[]> {
        const results = await this.flamelinkService.getAll(PromptContent);
        return results.results;
    }

}