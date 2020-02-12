import {
    SubscriptionTier,
    subscriptionTierDisplayName,
    SubscriptionTierSortValue
} from "@shared/models/MemberSubscription";
import SubscriptionProduct, {BillingPeriod} from "@shared/models/SubscriptionProduct";

export type BillingPeriodProductMap = {
    [period in BillingPeriod]?: SubscriptionProduct
}

export type ProductTierMap = {
    [tier in SubscriptionTier]?: SubscriptionProduct[]
}

export type ProductTierBillingMap = {
    [tier in SubscriptionTier]?: BillingPeriodProductMap
}

export interface SubscriptionProductGroup {
    tier: SubscriptionTier;
    tierDisplayName?: string;
    products: SubscriptionProduct[]
}

export function createSubscriptionProductGroup(products: SubscriptionProduct[]): SubscriptionProductGroup[] {
    const tierMap = getProductsByTier(products);
    const groups: SubscriptionProductGroup[] = Object.keys(tierMap).map((key) => {
        const tier = key as SubscriptionTier;
        const group: SubscriptionProductGroup = {
            tier,
            tierDisplayName: subscriptionTierDisplayName(tier),
            products: tierMap[tier] || [],

        };
        return group;
    });

    groups.sort((a, b) => {
        return SubscriptionTierSortValue[a.tier] - SubscriptionTierSortValue[b.tier]
    });

    return groups;
}

export function getProductsByTier(products: SubscriptionProduct[]): ProductTierMap {
    return products.reduce((map, product) => {
        const tier = product.subscriptionTier;
        const list: SubscriptionProduct[] = map[tier] || [];
        list.push(product);
        map[tier] = list;
        return map;
    }, {} as ProductTierMap);
}

export function getSubscriptionProductsByTierAndBillingPeriod(products: SubscriptionProduct[]): ProductTierBillingMap {
    return products.reduce((map, product) => {
        const tier = product.subscriptionTier;
        const period = product.billingPeriod;
        const tierMap = map[tier] || {};
        tierMap[period] = product;
        map[tier] = tierMap;
        return map;
    }, {} as ProductTierBillingMap)
}