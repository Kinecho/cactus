import {
    BillingPeriodSortOrder,
    subscriptionTierDisplayName,
    SubscriptionTierSortValue
} from "@shared/models/MemberSubscription";
import SubscriptionProduct, {BillingPeriod} from "@shared/models/SubscriptionProduct";
import SubscriptionProductGroup, {
    SubscriptionProductGroupMap,
    SubscriptionTier
} from "@shared/models/SubscriptionProductGroup";
import {CardBrand, WalletType} from "@shared/models/SubscriptionTypes";

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
    defaultSelectedPeriod?: BillingPeriod | undefined;
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
            defaultSelectedPeriod: productGroup?.defaultSelectedPeriod
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
        sortSubscriptionProductsByBillingPeriod(list);
        return map;
    }, {} as ProductTierMap);
}

export function sortSubscriptionProductsByBillingPeriod(products: SubscriptionProduct[]) {
    products.sort((a, b) => {
        return BillingPeriodSortOrder.indexOf(b.billingPeriod) - BillingPeriodSortOrder.indexOf(a.billingPeriod);
    });
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


export function getBrandDisplayName(brand?: CardBrand): string | undefined {
    let displayName: string | undefined = undefined;
    switch (brand) {
        case CardBrand.american_express:
            displayName = "American Express";
            break;
        case CardBrand.mastercard:
            displayName = "MasterCard";
            break;
        case CardBrand.diners_club:
            displayName = "Diners Club";
            break;
        case CardBrand.discover:
            displayName = "Discover";
            break;
        case CardBrand.jcb:
            displayName = "JCB";
            break;
        case CardBrand.union_pay:
            displayName = "UnionPay";
            break;
        case CardBrand.visa:
            displayName = "Visa";
            break;
        case CardBrand.unknown:
            displayName = undefined;
            break;
        default:
            displayName = undefined;
            break;
    }
    return displayName;
}

export interface DigitalWalletDetails {
    displayName?: string;
    icon?: string;
    type: WalletType;
}

export function getDigitalWalletDetails(walletType?: WalletType): DigitalWalletDetails | undefined {
    switch (walletType) {
        case WalletType.amex_express_checkout:
            return {displayName: "Amex Express Checkout", type: walletType};
        case WalletType.apple_pay:
            return {displayName: "ApplePay", type: walletType};
        case WalletType.google_pay:
            return {displayName: "GooglePay", type: walletType};
        case WalletType.masterpass:
            return {displayName: "Masterpass", type: walletType};
        case WalletType.samsung_pay:
            return {displayName: "Samsung Pay", type: walletType};
        case WalletType.visa_checkout:
            return {displayName: "Visa Checkout", type: walletType};
        default:
            return undefined;
    }
}