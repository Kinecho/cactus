import {
    subscriptionTierDisplayName,
    SubscriptionTierSortValue
} from "@shared/models/MemberSubscription";
import SubscriptionProduct, {BillingPeriod} from "@shared/models/SubscriptionProduct";
import SubscriptionProductGroup, {
    SubscriptionProductGroupMap,
    SubscriptionTier
} from "@shared/models/SubscriptionProductGroup";

export type BillingPeriodProductMap = {
    [period in BillingPeriod]?: SubscriptionProduct
}

export type ProductTierMap = {
    [tier in SubscriptionTier]?: SubscriptionProduct[]
}

export type ProductTierBillingMap = {
    [tier in SubscriptionTier]?: BillingPeriodProductMap
}

export interface SubscriptionProductGroupEntry {
    tier: SubscriptionTier;
    tierDisplayName?: string;
    products: SubscriptionProduct[];
    productGroup?: SubscriptionProductGroup;
}

export function createSubscriptionProductGroupEntries(products: SubscriptionProduct[], groupMap: SubscriptionProductGroupMap): SubscriptionProductGroupEntry[] {
    const tierMap = getProductsByTier(products);
    const groups: SubscriptionProductGroupEntry[] = Object.keys(tierMap).map((key) => {
        const tier = key as SubscriptionTier;
        const productGroup = groupMap[tier];
        const group: SubscriptionProductGroupEntry = {
            tier,
            tierDisplayName: subscriptionTierDisplayName(tier),
            products: tierMap[tier] || [],
            productGroup,
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