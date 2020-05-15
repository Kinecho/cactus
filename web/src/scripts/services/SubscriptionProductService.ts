import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import Logger from "@shared/Logger";
import FlamelinkService, { EntryObserverOptions } from "@web/services/FlamelinkService";
import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";

const logger = new Logger("SubscriptionProductService");
export default class SubscriptionProductService {
    public static sharedInstance = new SubscriptionProductService();
    flamelinkService = FlamelinkService.sharedInstance;

    async getByEntryId(entryId: string): Promise<SubscriptionProduct | undefined> {
        return this.flamelinkService.getById(entryId, SubscriptionProduct)
    }

    observeByEntryId(entryId: string, options: EntryObserverOptions<SubscriptionProduct>): ListenerUnsubscriber {
        return this.flamelinkService.observeByEntryId(entryId, SubscriptionProduct, options)
    }

    async getAllForSale(): Promise<SubscriptionProduct[]> {
        const result = await this.flamelinkService.getAllWhere({
            name: SubscriptionProduct.Fields.availableForSale,
            value: true,
            Type: SubscriptionProduct
        });
        return result.results;
    }

    async getByBillingPeriod(billingPeriod: BillingPeriod): Promise<SubscriptionProduct | undefined> {
        const result = await this.flamelinkService.getWhereFields([{
            name: SubscriptionProduct.Fields.availableForSale,
            value: true,
        }, {
            name: SubscriptionProduct.Fields.billingPeriod,
            value: billingPeriod,
        }], SubscriptionProduct);

        logger.info("SubscriptionProduct by billing period", result);
        return result;
    }
}