<template>
    <div class="upsellInner">
        <transition name="component-fade" appear mode="out-in">
            <div v-if="loading" :key="'product-loading'">
                <spinner message="Loading..." :delay="1200"/>
            </div>
            <div v-else :key="'checkout-info'" class="checkout-info">
                <!-- <p class="small" v-if="subscriptionProduct.trialDays && subscriptionProduct.trialDays > 0">
                    Cactus Plus is free for {{subscriptionProduct.trialDays}} days, then {{pricePerMonth}} /
                    {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. No commitment. Cancel
                    anytime.
                </p>
                <p class="small" v-else>
                    Cactus Plus is {{pricePerMonth}} /
                    {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. Cancel&nbsp;anytime.
                </p> -->
                <ul>
                    <li>
                        <svg-icon icon="heartOutline" class="icon"/>
                        <span>Personalized journal app with daily questions to reflect&nbsp;on</span>
                    </li>
                    <li>
                        <svg-icon icon="pie" class="icon"/>
                        <span>Insights dashboard, showing the things that make you&nbsp;happy</span>
                    </li>
                    <li>
                        <svg-icon icon="checkCircle" class="icon"/>
                        <span>Personality tests to help you better know&nbsp;yourself</span>
                    </li>
                </ul>

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
    import SvgIcon from "@components/SvgIcon.vue";

    @Component({
        components: {
            SvgIcon,
        }
    })
    export default class ProductUpsellMini extends Vue {
        name = "ProductUpsellMini";


        @Prop({ type: Object as () => SubscriptionProduct, required: false, default: null })
        subscriptionProduct!: SubscriptionProduct | null;

        @Prop({ type: Boolean, required: false, default: false })
        checkoutLoading!: boolean;

        @Prop({ type: String, default: "Try It Free" })
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

    ul {
        list-style: none;
        margin: 0 0 3.2rem;
        padding: 0;
        text-align: left;

        @include r(768) {
            margin: 0 auto .8rem;
            max-width: 40rem;
        }
    }

    li {
        align-items: flex-start;
        display: flex;

        &:not(:last-child) {
            margin-bottom: 2.4rem;
        }

        img {
            flex-shrink: 0;
            height: 2.8rem;
            margin: .4rem 1.6rem 0 0;
            width: 2.8rem;
        }
    }

</style>
