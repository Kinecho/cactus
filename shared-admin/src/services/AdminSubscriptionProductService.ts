import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";

export default class AdminSubscriptionProductService {
    protected static sharedInstance: AdminSubscriptionProductService;
    flamelinkService: AdminFlamelinkService;

    static getSharedInstance(): AdminSubscriptionProductService {
        if (!AdminSubscriptionProductService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminSubscriptionProductService before using it");
        }
        return AdminSubscriptionProductService.sharedInstance;
    }

    static initialize() {
        AdminSubscriptionProductService.sharedInstance = new AdminSubscriptionProductService();
    }

    constructor() {
        this.flamelinkService = AdminFlamelinkService.getSharedInstance();
    }

    async save(model: SubscriptionProduct): Promise<SubscriptionProduct | undefined> {
        return this.flamelinkService.save(model);
    }

    async getAll(): Promise<SubscriptionProduct[]> {
        const result = await this.flamelinkService.getAll(SubscriptionProduct);
        return result.results;
    }

    async getByEntryId(entryId: string): Promise<SubscriptionProduct | undefined> {
        return await this.flamelinkService.getByEntryId(entryId, SubscriptionProduct);
    }

    async getByStripePlanId(options: { planId: string, onlyAvailableForSale?: boolean }): Promise<SubscriptionProduct | undefined> {
        const fields: { name: string, value: any }[] = [{
            name: SubscriptionProduct.Fields.stripePlanId,
            value: options.planId,
        }];

        if (options.onlyAvailableForSale === true) {
            fields.push({
                name: SubscriptionProduct.Fields.availableForSale,
                value: true
            })
        }

        return this.flamelinkService.getWhereFields(fields, SubscriptionProduct);
    }

    async getByAppleProductId(options: { appleProductId?: string, onlyAvailableForSale?: boolean }): Promise<SubscriptionProduct | undefined> {
        if (!options.appleProductId) {
            return undefined;
        }
        const fields: { name: string, value: any }[] = [{
            name: SubscriptionProduct.Fields.appleProductId,
            value: options.appleProductId,
        }];

        if (options.onlyAvailableForSale === true) {
            fields.push({
                name: SubscriptionProduct.Fields.availableForSale,
                value: true
            })
        }

        return this.flamelinkService.getWhereFields(fields, SubscriptionProduct);
    }

    async getByAndroidProductId(options: { androidProductId?: string, onlyAvailableForSale?: boolean }): Promise<SubscriptionProduct | undefined> {
        if (!options.androidProductId) {
            return undefined;
        }
        const fields: { name: string, value: any }[] = [{
            name: SubscriptionProduct.Fields.androidProductId,
            value: options.androidProductId,
        }];

        if (options.onlyAvailableForSale === true) {
            fields.push({
                name: SubscriptionProduct.Fields.availableForSale,
                value: true
            })
        }

        return this.flamelinkService.getWhereFields(fields, SubscriptionProduct);
    }


}