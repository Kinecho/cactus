import {ListenerUnsubscriber} from "@web/services/FirestoreService";
import Logger from "@shared/Logger";
import FlamelinkService, {EntryObserverOptions} from "@web/services/FlamelinkService";
import SubscriptionProductGroup, {SubscriptionProductGroupMap} from "@shared/models/SubscriptionProductGroup";
import SubscriptionProductService from "@web/services/SubscriptionProductService";
import {
    createSubscriptionProductGroupEntries,
    SubscriptionProductGroupEntry
} from "@shared/util/SubscriptionProductUtil";

const logger = new Logger("SubscriptionProductGroupService");

export default class SubscriptionProductGroupService {
    public static sharedInstance = new SubscriptionProductGroupService();
    flamelinkService = FlamelinkService.sharedInstance;

    constructor() {
        logger.debug("Created a new SubscriptionProductGroupService instance")
    }

    async getByEntryId(entryId: string): Promise<SubscriptionProductGroup | undefined> {
        return this.flamelinkService.getById(entryId, SubscriptionProductGroup)
    }

    observeByEntryId(entryId: string, options: EntryObserverOptions<SubscriptionProductGroup>): ListenerUnsubscriber {
        return this.flamelinkService.observeByEntryId(entryId, SubscriptionProductGroup, options)
    }

    async getAll(): Promise<SubscriptionProductGroupMap> {
        const result = await this.flamelinkService.getAll(SubscriptionProductGroup);
        const groups = result.results;
        return groups.reduce((map, group) => {
            map[group.subscriptionTier] = group;
            return map;
        }, {} as SubscriptionProductGroupMap);
    }

    async getSortedProductGroupEntries(): Promise<SubscriptionProductGroupEntry[]> {
        const products = await SubscriptionProductService.sharedInstance.getAllForSale();
        const groups = await this.getAll();

        return createSubscriptionProductGroupEntries(products, groups);
    }

}