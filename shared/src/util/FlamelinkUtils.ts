import FlamelinkModel, {SchemaName} from "@shared/FlamelinkModel";
import PromptContent, {ContentStatus, Image} from "@shared/models/PromptContent";
import {isBlank} from "@shared/util/StringUtil";
import {getContentQueryDateStrings} from "@shared/util/DateUtil";
import Logger from "@shared/Logger";
import {DateObject} from "luxon";
import * as ContentTypes from '@flamelink/sdk-content-types';
import * as AppTypes from "@flamelink/sdk-app-types";
import {QueryResult} from "@shared/types/FirestoreTypes";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";

const logger = new Logger("FlamelinkUtils");

export interface GetByFieldOptions { name: string, value: string, populate?: boolean|string[] }

export interface GetModelByFieldOptions<T extends FlamelinkModel> extends GetByFieldOptions {
    Type: { new(): T }
}

export function fromFlamelinkData<T extends FlamelinkModel>(data: any, Type: { new(): T }): T {
    // const transformed = convertTimestampToDate(data);
    //not transforming timestamps yet
    const model = Object.assign(new Type(), data);
    model.updateFromData(data);
    return model;
}

export function fromFlamelinkQueryResults<T extends FlamelinkModel>(data: { [id: string]: any } | undefined, Type: { new(): T }): T[] {
    if (!data) {
        return [];
    }
    const values = Object.values(data);
    return values.map(d => fromFlamelinkData(d, Type));
}

export function buildQueryResult<T extends FlamelinkModel>(raw: any | undefined, Type: { new(): T }): QueryResult<T> {
    const results = fromFlamelinkQueryResults(raw, Type);
    return {results, size: results.length}
}

export function hasImage(image: Image | undefined) {
    if (!image) {
        return false;
    }

    return !(isBlank(image.storageUrl) && isBlank(image.flamelinkFileName) && isBlank(image.url) && isBlank(image.storageUrl) && (!image.fileIds || image.fileIds.length === 0));
}

export function getPromptContentForDateQueryOptions(options: { systemDate?: Date, dateObject?: DateObject, status?: ContentStatus, subscriptionTier?: SubscriptionTier }): ContentTypes.CF.Get | undefined {
    const {systemDate, dateObject, status, subscriptionTier} = options;
    const queryDates = getContentQueryDateStrings({systemDate, dateObject});
    if (!queryDates) {
        logger.error("CAN NOT FETCH PROMPT CONTENT, NO DATES FOUND");
        return;
    }
    const {startDateString, endDateString} = queryDates;
    logger.log("start date", startDateString);
    logger.log("end date", endDateString);

    const filters: AppTypes.CF.FilterClause[] = [];
    if (status) {
        logger.log("adding status filter for status = ", status);
        filters.push([PromptContent.Fields.contentStatus, "==", status])
    }

    if (subscriptionTier) {
        logger.info(`Adding subscription tier filter: ${subscriptionTier}`);
        filters.push([PromptContent.Fields.subscriptionTiers, "array-contains", subscriptionTier]);
    }

    return {
        schemaKey: SchemaName.promptContent,
        // field: PromptContent.Fields.scheduledSendAt,
        filters,
        orderBy: {field: PromptContent.Fields.scheduledSendAt, order: "desc"},
        startAt: startDateString,
        endAt: endDateString,
    } as ContentTypes.CF.Get;
}