import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import ReflectionPrompt, { Field } from "@shared/models/ReflectionPrompt";
import { Campaign } from "@shared/mailchimp/models/MailchimpTypes";
import { getDateFromISOString } from "@shared/util/DateUtil";
import Logger from "@shared/Logger";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import CactusMember from "@shared/models/CactusMember";

const logger = new Logger("AdminReflectionPromptService");
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

    async setShared(promptId: string, shared: boolean): Promise<void> {
        try {
            const doc = this.getCollectionRef().doc(promptId);
            await doc.update({ [ReflectionPrompt.Field.shared]: shared })
            return;
        } catch (error) {
            logger.error("Failed to update doc, it may not exist", error)
            return;
        }
    }

    async getPromptForCampaignId(campaignId?: string): Promise<ReflectionPrompt | undefined> {
        if (!campaignId) {
            return undefined;
        }

        const collection = firestoreService.getCollectionRef(Collection.reflectionPrompt);
        const query = collection.where(Field.campaignIds, "array-contains", campaignId);


        const { results, size } = await firestoreService.executeQuery(query, ReflectionPrompt);
        if (size > 1) {
            logger.warn("Found more than one question prompt for given campaign id");
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

        const { results, size } = await firestoreService.executeQuery(query, ReflectionPrompt);
        if (size > 1) {
            logger.warn("Found more than one question prompt for given campaign id");
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
                logger.warn("Unable to find matching campaign info on reflection prompt", reflectionPrompt.id, "for campaignId", campaign.id);
                return reflectionPrompt;
            }

            await this.save(reflectionPrompt)
        }

        return reflectionPrompt;
    }

    async getAllBatch(options: {
        onData: (models: ReflectionPrompt[], batchNumber: number) => Promise<void>,
        batchSize?: number,
        includeDeleted?: boolean,
    }): Promise<void> {
        const query = this.getCollectionRef();

        await firestoreService.executeBatchedQuery({
            query,
            type: ReflectionPrompt,
            onData: options.onData,
            batchSize: options?.batchSize,
            orderBy: BaseModelField.createdAt,
            sortDirection: QuerySortDirection.asc,
            includeDeleted: options.includeDeleted,
        });
        return;
    }

    async get(id: string): Promise<ReflectionPrompt | undefined> {
        return firestoreService.getById(id, ReflectionPrompt);
    }

    async updateSharingForReflection(reflection: ReflectionResponse, member: CactusMember): Promise<void> {
        const memberId = member.id;
        const promptId = reflection.promptId
        if (!memberId || !promptId) {
            return;
        }
        const prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);
        if (prompt && prompt.memberId === memberId) {
            await this.setShared(promptId, reflection.shared);
        }
    }
}