<template>
    <div class="upsellContainer">
        <ResultElement :element="element" :selectable="false"/>
        <p class="subtext">Great! To focus on <strong>{{element}}</strong> start a trial of Cactus Plus.</p>
        <p class="small bold">You'll get access to:</p>
        <section class="features">
            <ul>
                <li>
                    <svg-icon icon="checkCircle" class="icon"/>
                    <span><strong>Tools</strong> to help you identify and strengthen your core values</span>
                </li>
                <li>
                    <svg-icon icon="heart" class="icon"/>
                    <span><strong>Daily, personalized</strong> mental fitness exercises</span>
                </li>
                <li>
                    <svg-icon icon="pie" class="icon"/>
                    <span><strong>Personal insights</strong> dashboard, visualizing your progress</span>
                </li>
            </ul>
            <template v-if="loading">
                <spinner message="Loading..."/>
            </template>
            <template v-else>
                <button @click="checkout" :disabled="checkoutLoading">Try it Free</button>
                <p class="small" v-if="subscriptionProduct.trialDays && subscriptionProduct.trialDays > 0">
                    Cactus Plus is free for {{subscriptionProduct.trialDays}} days, then {{pricePerMonth}} /
                    {{displayPeriod}}<span v-if="isAnnualBilling">, billed annually</span>.
                    <strong>Cancel anytime.</strong>
                </p>
                <p class="small" v-else>
                    Cactus Plus is {{pricePerMonth}} /
                    {{displayPeriod}}<span v-if="isAnnualBilling">, billed annually</span>.
                    <strong>Cancel anytime.</strong>
                </p>
            </template>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import Spinner from "@components/Spinner.vue";
    import ResultElement from "@components/gapanalysis/ResultElement.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import { Prop } from "vue-property-decorator";
    import SvgIcon from "@components/SvgIcon.vue";
    import { formatPriceCentsUsd } from "@shared/util/StringUtil";

    @Component({
        components: {
            SvgIcon,
            ResultElement,
            Spinner,
        }
    })
    export default class GapAnalysisUpsell extends Vue {
        name = "GapAnalysisUpsell";

        @Prop({ type: String as () => CactusElement, required: true })
        element!: CactusElement;

        @Prop({ type: Object as () => SubscriptionProduct, required: false, default: null })
        subscriptionProduct!: SubscriptionProduct | null;

        @Prop({ type: Boolean, required: false, default: false })
        checkoutLoading!: boolean;

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
    @import "variables";
    @import "mixins";

    .upsellContainer {
        background: $beige;
        padding: 6.4rem 2.4rem;
    }

    .element-icon {
        margin-bottom: 3.2rem;
    }

    .subtext {
        font-size: 2rem;
    }

    .small {
        font-size: 1.6rem;
    }

    .bold {
        font-weight: bold;
    }

    p {
        margin: 0 0 1.6rem;
    }

    .features {
        @include shadowbox;
        margin: 0 auto;
        max-width: 40rem;
        padding: 3.2rem 2.4rem;
        text-align: left;

        ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        li {
            align-items: flex-start;
            display: flex;
            margin-bottom: 2.4rem;

            img {
                height: 2.8rem;
                margin: .4rem 1.6rem 0 0;
                width: 2.8rem;
            }
        }
    }
</style>
