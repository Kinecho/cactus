import FlamelinkService, { EntryObserverOptions } from "@web/services/FlamelinkService";
import PromptContent, { ContentStatus } from "@shared/models/PromptContent";
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import { fromFlamelinkData, getPromptContentForDateQueryOptions } from "@shared/util/FlamelinkUtils";
import { DateObject } from "luxon";
import Logger from "@shared/Logger";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";

const logger = new Logger("PromptContentService");

export type GetContentParams = { promptId?: string | null, entryId?: string | null };

export default class PromptContentService {
    public static sharedInstance = new PromptContentService();
    flamelinkService = FlamelinkService.sharedInstance;

    getByEntryId(entryId: string): Promise<PromptContent | undefined> {
        return this.flamelinkService.getById(entryId, PromptContent)
    }

    observeByEntryId(entryId: string, options: EntryObserverOptions<PromptContent>): ListenerUnsubscriber {
        return this.flamelinkService.observeByEntryId(entryId, PromptContent, options)
    }

    observeByPromptId(promptId: string, options: EntryObserverOptions<PromptContent>): ListenerUnsubscriber {
        return this.flamelinkService.observeByField({
            name: PromptContent.Fields.promptId,
            value: promptId,
            Type: PromptContent
        }, options)
    }

    observeByPromptOrEntryId(params: GetContentParams, options: EntryObserverOptions<PromptContent>): ListenerUnsubscriber | undefined {
        if (params.entryId) {
            return this.observeByEntryId(params.entryId, options);
        } else if (params.promptId) {
            return this.observeByPromptId(params.promptId, options)
        } else {
            options.onData(undefined, "No prompt or entry ID was provided. Can not load content.");
            return;
        }
    }

    getByPromptId(promptId: string): Promise<PromptContent | undefined> {
        return this.flamelinkService.getFirstByField({
            name: PromptContent.Fields.promptId,
            value: promptId,
            Type: PromptContent
        });
    }

    async getPromptContentForDate(options: {
        subscriptionTier: SubscriptionTier
        systemDate?: Date,
        dateObject?: DateObject,
        status?: ContentStatus
    }): Promise<PromptContent | undefined> {
        try {
            const getOptions = getPromptContentForDateQueryOptions(options);
            if (!getOptions) {
                logger.error("Unable to get query options for prompt content date");
                return;
            }
            const raw = await this.flamelinkService.content.get(getOptions);

            if (!raw) {
                logger.warn("PromptContentService.getPromptContentForDate: No objects found for dates given");
                return;
            }

            const allValues = Object.values(raw);
            logger.log(`Found ${ allValues.length } that matched the criteria for the date range`);
            const [content]: (any | undefined)[] = allValues;
            if (!content) {
                return undefined;
            }

            return fromFlamelinkData(content, PromptContent);
        } catch (error) {
            logger.error("Failed to fetch content", error);
            return undefined;
        }
    }
}



