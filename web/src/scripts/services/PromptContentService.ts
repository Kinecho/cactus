import FlamelinkService, {EntryObserverOptions} from "@web/services/FlamelinkService";
import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import {ListenerUnsubscriber} from "@web/services/FirestoreService";
import {fromFlamelinkData, getPromptContentForDateQueryOptions} from "@shared/util/FlamelinkUtils";
import {DateObject} from "luxon";
import Logger from "@shared/Logger";

const logger = new Logger("PromptContentService");

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

    getByPromptId(promptId: string): Promise<PromptContent | undefined> {
        return this.flamelinkService.getByField({
            name: PromptContent.Fields.promptId,
            value: promptId,
            Type: PromptContent
        });
    }

    async getPromptContentForDate(options: { systemDate?: Date, dateObject?: DateObject, status?: ContentStatus }): Promise<PromptContent | undefined> {
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
            logger.log(`Found ${allValues.length} that matched the criteria for the date range`);
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



