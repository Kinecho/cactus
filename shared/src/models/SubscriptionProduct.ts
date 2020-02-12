import FlamelinkModel, {SchemaName} from "@shared/FlamelinkModel";
import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";

export enum BillingPeriod {
    monthly = "monthly",
    yearly = "yearly",
    once = "once",
    never = "never",
}

enum Fields {
    availableForSale = "availableForSale"
}


export default class SubscriptionProduct extends FlamelinkModel {
    readonly schema = SchemaName.subscriptionProducts;
    static Fields = Fields;
    displayName: string = "";
    priceCentsUsd: number = 0;
    billingPeriod: BillingPeriod = BillingPeriod.monthly;
    appleProductId?: string;
    stripePlanId?: string;
    availableForSale: boolean = false;
    subscriptionTier: SubscriptionTier = SubscriptionTier.PLUS;

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