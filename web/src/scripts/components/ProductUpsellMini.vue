<template>
    <div>
        <transition name="component-fade" appear mode="out-in">
            <div v-if="loading" :key="'product-loading'">
                <spinner message="Loading..." :delay="1200"/>
            </div>
            <div v-else :key="'checkout-info'" class="checkout-info">
                <button @click="checkout" :disabled="checkoutLoading">{{ctaText}}</button>
                <p class="small" v-if="subscriptionProduct.trialDays && subscriptionProduct.trialDays > 0">
                    Cactus Plus is free for {{subscriptionProduct.trialDays}} days, then {{pricePerMonth}} /
                    {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. No commitment. Cancel
                    anytime.
                </p>
                <p class="small" v-else>
                    Cactus Plus is {{pricePerMonth}} /
                    {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. Cancel&nbsp;anytime.
                </p>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import { formatPriceCentsUsd } from "@shared/util/StringUtil";

    @Component
    export default class ProductUpsellMini extends Vue {
        name = "ProductUpsellMini";


        @Prop({ type: Object as () => SubscriptionProduct, required: false, default: null })
        subscriptionProduct!: SubscriptionProduct | null;

        @Prop({ type: Boolean, required: false, default: false })
        checkoutLoading!: boolean;

        @Prop({ type: String, default: "Try it free" })
        ctaText!: string;

        get loading(): boolean {
            return !this.subscriptionProduct
        }

        get pricePerMonth(): string | undefined {
            if (!this.subscriptionProduct) {
                return;
            }

            if (this.subscriptionProduct?.billingPeriod === BillingPeriod.yearly) {
                return formatPriceCentsUsd(this.subscriptionProduct.priceCentsUsd / 12);
            } else {
                return formatPriceCentsUsd(this.subscriptionProduct.priceCentsUsd);
            }
        }

        get displayPeriod(): string {
            if (this.subscriptionProduct?.billingPeriod !== BillingPeriod.weekly) {
                return "month"
            }
            return this.subscriptionProduct.billingPeriod;
        }

        get isAnnualBilling(): boolean {
            return this.subscriptionProduct?.billingPeriod === BillingPeriod.yearly;
        }

        checkout() {
            this.$emit('checkout', this.subscriptionProduct);
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";


    .small {
        font-size: 1.4rem;
        margin-bottom: 0;
        opacity: .8;
    }

    button {
        margin: 0 auto 2.4rem;
        max-width: 40rem;
        width: 100%;

        @include r(768) {
            margin-bottom: .8rem;
        }
    }

    .checkout-info {
        p {
            max-width: 40rem;
            margin: 0 auto;
        }
    }
</style>