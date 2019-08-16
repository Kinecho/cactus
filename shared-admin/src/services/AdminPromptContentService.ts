import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import PromptContent from "@shared/models/PromptContent";
import {SchemaName} from "@shared/FlamelinkModel";


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

    async getById(id?: string): Promise<PromptContent | undefined> {
        if (!id) {
            return undefined;
        }
        return await this.flamelinkService.getById(id, PromptContent);
    }

}