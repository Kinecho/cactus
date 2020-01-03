import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import {Collection} from "@shared/FirestoreBaseModels";
import ReflectionPrompt, {Field} from "@shared/models/ReflectionPrompt";
import {Campaign} from "@shared/mailchimp/models/MailchimpTypes";
import {getDateFromISOString} from "@shared/util/DateUtil";


let firestoreService: AdminFirestoreService;

export default class AdminReflectionPromptService {

    protected static sharedInstance: AdminReflectionPromptService;

    static getSharedInstance(): AdminReflectionPromptService {
        if (!AdminReflectionPromptService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminReflectionPromptService before using it");
        }
        return AdminReflectionPromptService.sharedInstance;
    }

    public static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminReflectionPromptService.sharedInstance = new AdminReflectionPromptService();
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.reflectionPrompt);
    }

    createDocId(): string {
        return this.getCollectionRef().doc().id;
    }

    async save(model: ReflectionPrompt): Promise<ReflectionPrompt> {
        return firestoreService.save(model);
    }

    async getPromptForCampaignId(campaignId?: string): Promise<ReflectionPrompt | undefined> {
        if (!campaignId) {
            return undefined;
        }

        const collection = firestoreService.getCollectionRef(Collection.reflectionPrompt);
        const query = collection.where(Field.campaignIds, "array-contains", campaignId);


        const {results, size} = await firestoreService.executeQuery(query, ReflectionPrompt);
        if (size > 1) {
            console.warn("Found more than one question prompt for given campaign id");
        }

        const [prompt] = results;
        return prompt;
    }

    async getPromptForPromptContentEntryId(entryId?: string): Promise<ReflectionPrompt | undefined> {
        if (!entryId) {
            return undefined;
        }

        const collection = firestoreService.getCollectionRef(Collection.reflectionPrompt);
        const query = collection.where(Field.promptContentEntryId, "==", entryId);

        const {results, size} = await firestoreService.executeQuery(query, ReflectionPrompt);
        if (size > 1) {
            console.warn("Found more than one question prompt for given campaign id");
        }

        const [prompt] = results;
        return prompt;
    }

    async updateCampaign(campaign: Campaign): Promise<ReflectionPrompt | undefined> {
        const reflectionPrompt = await this.getPromptForCampaignId(campaign.id);

        if (reflectionPrompt) {
            if (reflectionPrompt.campaign && reflectionPrompt.campaign.id === campaign.id) {
                reflectionPrompt.campaign = campaign;
                if (campaign.send_time) {
                    reflectionPrompt.sendDate = getDateFromISOString(campaign.send_time)
                }
            } else if (reflectionPrompt.reminderCampaign && reflectionPrompt.reminderCampaign.id === campaign.id) {
                reflectionPrompt.reminderCampaign = campaign;
            } else {
                console.warn("Unable to find matching campaign info on reflection prompt", reflectionPrompt.id, "for campaignId", campaign.id);
                return reflectionPrompt;
            }

            await this.save(reflectionPrompt)
        }

        return reflectionPrompt;
    }

    async get(id: string): Promise<ReflectionPrompt | undefined> {
        return firestoreService.getById(id, ReflectionPrompt);
    }
}