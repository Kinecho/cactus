import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";
import { BillingPeriod } from "@shared/models/SubscriptionProduct";


enum Fields {
    subscriptionTier = "subscriptionTier",

}

export type IconType = "heart" | "check" | "lock" | "calendar" | "journal"

export type SubscriptionProductGroupMap = {
    [tier in SubscriptionTier]?: SubscriptionProductGroup
}

export interface ProductFeature {
    descriptionMarkdown?: string
    icon?: IconType,
}

export interface ProductSection {
    title?: string
    features?: ProductFeature[]
}

export enum SubscriptionTier {
    BASIC = "BASIC",
    PLUS = "PLUS",
    PREMIUM = "PREMIUM",
}

export const DEFAULT_SUBSCRIPTION_TIER = SubscriptionTier.BASIC;

export interface ProductGroupFooter {
    textMarkdown?: string
    icon?: IconType
}

export default class SubscriptionProductGroup extends FlamelinkModel {
    readonly schema = SchemaName.subscriptionProductGroups;
    static Fields = Fields;
    subscriptionTier!: SubscriptionTier;
    title?: string;
    descriptionMarkdown?: string;
    defaultSelectedPeriod?: BillingPeriod;
    sections: ProductSection[] = [];
    trialUpgradeMarkdown?: string;
    footer?: ProductGroupFooter;

    constructor(data?: Partial<SubscriptionProductGroup>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}