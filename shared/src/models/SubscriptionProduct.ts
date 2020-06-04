import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";

export enum BillingPeriod {
    weekly = "weekly",
    monthly = "monthly",
    yearly = "yearly",
    once = "once",
    never = "never",
}

enum Fields {
    availableForSale = "availableForSale",
    stripePlanId = "stripePlanId",
    appleProductId = "appleProductId",
    androidProductId = "androidProductId",
    billingPeriod = "billingPeriod",
}

export default class SubscriptionProduct extends FlamelinkModel {
    readonly schema = SchemaName.subscriptionProducts;
    static Fields = Fields;
    displayName: string = "";
    priceCentsUsd: number = 0;
    billingPeriod: BillingPeriod = BillingPeriod.monthly;
    appleProductId?: string;
    androidProductId?: string;
    stripePlanId?: string;
    availableForSale: boolean = false;
    subscriptionTier: SubscriptionTier = SubscriptionTier.PLUS;
    savingsCopy?: string;
    trialDays?: number | undefined;

    constructor(data?: Partial<SubscriptionProduct>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }

    get isFree(): boolean {
        return this.priceCentsUsd === 0 || this.billingPeriod === BillingPeriod.never;
    }
}