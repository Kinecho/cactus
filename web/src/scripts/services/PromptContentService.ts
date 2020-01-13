import FlamelinkService, {EntryObserverOptions} from "@web/services/FlamelinkService";
import PromptContent, {ContentStatus} from "@shared/models/PromptContent";
import {ListenerUnsubscriber} from "@web/services/FirestoreService";
import {SchemaName} from "@shared/FlamelinkModel";
import {dateObjectToISODate, getFlamelinkDateString, plusDays} from "@shared/util/DateUtil";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";
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
            const {systemDate, dateObject, status} = options;

            let startDateString = "";
            let endDateString = "";
            if (dateObject) {
                dateObject.hour = 0;
                dateObject.minute = 0;
                dateObject.second = 0;
                dateObject.millisecond = 0;
                endDateString = dateObjectToISODate(dateObject);
                const startObject = {...dateObject, day: dateObject.day! + 1};
                startDateString = dateObjectToISODate(startObject);
            } else if (systemDate) {
                const midnightDenver = new Date(systemDate); //make a copy of the date so we don't edit the original one
                midnightDenver.setHours(0);
                midnightDenver.setMinutes(0);
                midnightDenver.setSeconds(0);
                midnightDenver.setMilliseconds(0);
                const nextDate = plusDays(1, midnightDenver);
                nextDate.setHours(0);
                startDateString = getFlamelinkDateString(nextDate);
                endDateString = getFlamelinkDateString(midnightDenver);

            } else {
                logger.error("No valid date passed into getPromptContentForDate method");
                return;
            }

            logger.log("start date", startDateString);
            logger.log("end date", endDateString);

            const filters: string[][] = [];
            if (status) {
                logger.log("adding status filter for status = ", status);
                filters.push([PromptContent.Fields.contentStatus, "==", status])
            }

            const getOptions = {
                schemaKey: SchemaName.promptContent,
                filters,
                orderBy: {field: PromptContent.Fields.scheduledSendAt, order: "desc"},
                startAt: startDateString,
                endAt: endDateString,
            };

            const raw = await this.flamelinkService.content.get(getOptions);

            if (!raw) {
                logger.warn("PromptContentService.getPromptContentForDate: No objects found for dates given");
                return
            }

            const allValues = Object.values(raw);
            logger.log(`Found ${allValues.length} that matched the criteria for the date range`);
            const [content]: (any | undefined)[] = allValues;
            if (!content) {
                return undefined
            }

            return fromFlamelinkData(content, PromptContent);
        } catch (error) {
            logger.error("Failed to fetch content", error);
            return undefined;
        }
    }
}



