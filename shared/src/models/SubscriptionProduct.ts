import FlamelinkModel, {SchemaName} from "@shared/FlamelinkModel";

export enum BillingPeriod {
    monthly = "monthly",
    yearly = "yearly",
}

export default class SubscriptionProduct extends FlamelinkModel {
    readonly schema = SchemaName.subscriptionProducts;
    displayName: string = "";
    priceCentsUsd: number = 0;
    billingPeriod: BillingPeriod = BillingPeriod.monthly;
    appleProductId?: string;

    constructor(data?: Partial<SubscriptionProduct>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}