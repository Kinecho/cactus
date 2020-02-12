import SubscriptionProduct, {BillingPeriod} from "@shared/models/SubscriptionProduct";
import {SubscriptionTier} from "@shared/models/MemberSubscription";
import {
    createSubscriptionProductGroup,
    getSubscriptionProductsByTierAndBillingPeriod
} from "@shared/util/SubscriptionProductUtil";

function createProduct(name: string, tier: SubscriptionTier, period: BillingPeriod, price: number): SubscriptionProduct {
    const p = new SubscriptionProduct();
    p.billingPeriod = period;
    p.priceCentsUsd = price;
    p.displayName = name;
    p.subscriptionTier = tier;
    return p;
}


describe("product tier map", () => {
    const free = createProduct("Free", SubscriptionTier.BASIC, BillingPeriod.never, 0);
    const monthly = createProduct("Monthly", SubscriptionTier.PLUS, BillingPeriod.monthly, 299);
    const yearly = createProduct("Yearly", SubscriptionTier.PLUS, BillingPeriod.yearly, 2900);
    const products = [
        free,
        monthly,
        yearly,
    ];

    test("mapped correctly", () => {
        const map = getSubscriptionProductsByTierAndBillingPeriod(products);
        expect(map[SubscriptionTier.BASIC]?.never).toEqual(free);
        expect(map[SubscriptionTier.BASIC]?.monthly).toBeUndefined();

        expect(map[SubscriptionTier.PLUS]?.monthly).toEqual(monthly);
        expect(map[SubscriptionTier.PLUS]?.yearly).toEqual(yearly);
        expect(map[SubscriptionTier.PLUS]?.never).toBeUndefined();
    });

    test("groups created correctly", () => {
        const groups = createSubscriptionProductGroup(products);

        expect(groups.length).toEqual(2);
        expect(groups[0].tier).toEqual(SubscriptionTier.BASIC);
        expect(groups[0].products.length).toEqual(1);

        expect(groups[1].tier).toEqual(SubscriptionTier.PLUS);
        expect(groups[1].products.length).toEqual(2);
    });
});