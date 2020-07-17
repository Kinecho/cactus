import Vue from "vue";
import { CactusElement } from "@shared/models/CactusElement";
import { boolean, number, select } from "@storybook/addon-knobs";
import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
import { action } from "@storybook/addon-actions";
import Logger from "@shared/Logger"
import LoadableGapAnalysisUpsell from "@components/gapanalysis/LoadableGapAnalysisUpsell.vue";
import GapAnalysisUpsell from "@components/gapanalysis/GapAnalysisUpsell.vue";

const logger = new Logger("GapAnalysisUpsell.stories");

export default {
    title: "Gap Analysis/Upsell",
}

export const StaticProduct = () => Vue.extend({
    template: `
        <div>
            <GapAnalysisUpsell :element="element"
                    :subscription-product="product"
                    @checkout="checkout"
                    @skip="skip"
                    :checkout-loading="checkoutLoading"
            />
        </div>`,
    components: {
        GapAnalysisUpsell: GapAnalysisUpsell,
    },
    props: {
        element: {
            type: String as () => CactusElement,
            default: select("Element", [CactusElement.energy,
                CactusElement.meaning,
                CactusElement.experience,
                CactusElement.relationships,
                CactusElement.emotions], CactusElement.meaning),
        },
        productLoading: {
            default: boolean("Product Loading", false)
        },
        price: {
            default: number("Price (Cents USD)", 2999)
        },
        trialDays: {
            default: number("Trial Days", 7),
        },
        billingPeriod: {
            default: select("Billing Period", [
                BillingPeriod.once,
                BillingPeriod.weekly,
                BillingPeriod.monthly,
                BillingPeriod.yearly,
            ], BillingPeriod.yearly)
        }
    },
    data() {
        return {
            checkoutLoading: false,
        }
    },
    computed: {
        product(): SubscriptionProduct | null {
            const product = new SubscriptionProduct({ stripePlanId: "ppp", billingPeriod: this.billingPeriod })
            product.entryId = "134";
            product.priceCentsUsd = this.price;
            product.trialDays = this.trialDays;
            return this.productLoading ? null : product;
        }
    },
    methods: {
        checkout() {
            logger.info("Starting checkout!");
            action("Checkout started!")("Stripe Plan = ", this.product?.stripePlanId);
            this.checkoutLoading = true;

            setTimeout(() => {
                this.checkoutLoading = false;
            }, 1500);
        }, skip() {
            alert("This is going to be skipped!");
        }
    }

})


export const LoadedFromServer = () => Vue.extend({
    template: `
        <div>
            <loadable-gap-analysis-upsell :billing-period="billingPeriod" :element="element"/>
        </div>`,
    components: {
        LoadableGapAnalysisUpsell
    },
    props: {
        billingPeriod: {
            default: select("Billing Period", [
                BillingPeriod.once,
                BillingPeriod.weekly,
                BillingPeriod.monthly,
                BillingPeriod.yearly,
            ], BillingPeriod.yearly)
        },
        element: {
            type: String as () => CactusElement,
            default: select("Element", [CactusElement.energy,
                CactusElement.meaning,
                CactusElement.experience,
                CactusElement.relationships,
                CactusElement.emotions], CactusElement.meaning),
        },
    }
})