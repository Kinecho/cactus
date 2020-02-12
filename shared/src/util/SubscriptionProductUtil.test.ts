import SubscriptionProduct, {BillingPeriod} from "@shared/models/SubscriptionProduct";
import {
    createSubscriptionProductGroupEntries,
    getSubscriptionProductsByTierAndBillingPeriod
} from "@shared/util/SubscriptionProductUtil";
import SubscriptionProductGroup, {
    SubscriptionProductGroupMap,
    SubscriptionTier
} from "@shared/models/SubscriptionProductGroup";

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

    const groupBasic = new SubscriptionProductGroup();
    groupBasic.subscriptionTier = SubscriptionTier.BASIC;
    groupBasic.title = "Basic";
    groupBasic.descriptionMarkdown = "Get occasional prompts";

    const groupPlus = new SubscriptionProductGroup();
    groupPlus.subscriptionTier = SubscriptionTier.PLUS;
    groupPlus.title = "Plus";
    groupPlus.descriptionMarkdown = "Daily prompts";

    const productGroupsMap: SubscriptionProductGroupMap = {
        [SubscriptionTier.BASIC]: groupBasic,
        [SubscriptionTier.PLUS]: groupPlus,
    };

    test("mapped correctly", () => {
        const map = getSubscriptionProductsByTierAndBillingPeriod(products);
        expect(map[SubscriptionTier.BASIC]?.never).toEqual(free);
        expect(map[SubscriptionTier.BASIC]?.monthly).toBeUndefined();

        expect(map[SubscriptionTier.PLUS]?.monthly).toEqual(monthly);
        expect(map[SubscriptionTier.PLUS]?.yearly).toEqual(yearly);
        expect(map[SubscriptionTier.PLUS]?.never).toBeUndefined();
    });

    test("groups created correctly", () => {
        const groups = createSubscriptionProductGroupEntries(products, productGroupsMap);

        expect(groups.length).toEqual(2);
        expect(groups[0].tier).toEqual(SubscriptionTier.BASIC);
        expect(groups[0].products.length).toEqual(1);
        expect(groups[0].productGroup).toEqual(groupBasic);


        expect(groups[1].tier).toEqual(SubscriptionTier.PLUS);
        expect(groups[1].products.length).toEqual(2);
        expect(groups[1].productGroup).toEqual(groupPlus);
    });
});