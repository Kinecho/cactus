<template>
    <results-upsell :checkout-loading="loading"
            :subscription-product="product"
            :element="selectedElement"
            @checkout="checkout"
            @skip="skip"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ResultsUpsell from "@components/upgrade/QuizResultsUpsell.vue";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import { CactusElement } from "@shared/models/CactusElement";
    import { Prop, Watch } from "vue-property-decorator";
    import SubscriptionProductService from "@web/services/SubscriptionProductService";
    import Logger from "@shared/Logger"
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";

    const logger = new Logger("LoadableQuizResultsUpsell");

    @Component({
        components: { ResultsUpsell }
    })
    export default class LoadableQuizResultsUpsell extends Vue {
        name = "LoadableQuizResultsUpsell";

        @Prop({ type: String as () => CactusElement, required: false, default: null })
        element!: CactusElement | null;

        @Prop({ type: String as () => BillingPeriod, required: true, default: BillingPeriod.yearly })
        billingPeriod!: BillingPeriod;

        @Watch("billingPeriod")
        async billingPeriodChanged(current: BillingPeriod, previous: BillingPeriod | undefined) {
            if (current !== previous) {
                await this.fetchProduct()
            }
        }

        loaded = false;
        product: SubscriptionProduct | null = null;

        async beforeMount() {
            await this.fetchProduct()
        }

        async fetchProduct() {
            this.loaded = false;
            this.product = await SubscriptionProductService.sharedInstance.getByBillingPeriod(this.billingPeriod) ?? null;
            logger.info("Fetched subscription product for billing period: ", this.billingPeriod, this.product);
            this.$emit('product', this.product);
            this.loaded = true;
        }

        get loading(): boolean {
            return !this.loaded
        }

        /**
         * Just relay it to the calling component
         * @param {SubscriptionProduct | undefined | null} subscriptionProduct
         */
        checkout(subscriptionProduct: SubscriptionProduct | undefined | null) {
            this.$emit('checkout', subscriptionProduct)
        }

        skip() {
            this.$emit('skip');
        }

        get selectedElement(): CactusElement | null {
            return this.element ?? getQueryParam(QueryParam.SELECTED_ELEMENT) as (CactusElement | null) ?? null;
        }
    }
</script>

<style scoped lang="scss">

</style>