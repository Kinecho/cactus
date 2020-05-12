<template>
    <div class="upsellContainer">
        <template v-if="element">
            <ResultElement :element="element" :selectable="false" :withCircle="true"/>
            <p class="subtext">Great choice! To focus on <strong>what makes you happy</strong>, Cactus Plus gives you
                access to:</p>
        </template>
        <p class="subtext" v-else>To focus on <strong>what makes you happy</strong>, Cactus Plus gives you access to:
        </p>
        <section class="features">
            <ul>
                <li>
                    <svg-icon icon="heartOutline" class="icon"/>
                    <span><strong>Personalized</strong> mental fitness exercises<span v-if="element">, beginning today with <i>{{element}}</i></span></span>
                </li>
                <li>
                    <svg-icon icon="pie" class="icon"/>
                    <span><strong>Personal insights</strong> dashboard, visualizing your progress</span>
                </li>
                <li>
                    <svg-icon icon="checkCircle" class="icon"/>
                    <span><strong>Tools</strong> to help you better know yourself, including your unique core values</span>
                </li>
            </ul>
            <transition name="component-fade" appear mode="out-in">
                <div v-if="loading" key="loading">
                    <spinner message="Loading..." :delay="1200"/>
                </div>
                <div v-else key="checkout-info">
                    <button @click="checkout" :disabled="checkoutLoading">Try it Free</button>
                    <p class="small" v-if="subscriptionProduct.trialDays && subscriptionProduct.trialDays > 0">
                        Cactus Plus is free for {{subscriptionProduct.trialDays}} days, then {{pricePerMonth}} /
                        {{displayPeriod}}<span v-if="isAnnualBilling">, billed annually</span>.
                        <strong>Cancel anytime.</strong>
                    </p>
                    <p class="small" v-else>
                        Cactus Plus is {{pricePerMonth}} /
                        {{displayPeriod}}<span v-if="isAnnualBilling">, billed annually</span>.
                        <strong>Cancel&nbsp;anytime.</strong>
                    </p>
                </div>
            </transition>
        </section>
        <button class="tertiary" @click="skip">Skip for now</button>
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

        skip() {
            this.$emit('skip');
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "transitions";

    .upsellContainer {
        padding: 6.4rem 2.4rem;

        @include r(768) {
            background: $beige;
            padding: 6.4rem 0 0;
        }
    }

    .element-icon {
        margin-bottom: 3.2rem;
    }

    .subtext {
        font-size: 2rem;
        margin: 0 auto 3.2rem;
        max-width: 48rem;
    }

    .bold {
        font-weight: bold;
    }

    p {
        margin: 0 0 3.2rem;
    }

    .features {
        @include shadowbox;
        margin: 0 auto 3.2rem;
        max-width: 40rem;
        padding: 3.2rem 2.4rem;
        text-align: center;

        @include r(768) {
            border-radius: 0;
            box-shadow: none;
            margin-bottom: 0;
            max-width: none;
            padding: 3.2rem 3.2rem 8.8rem;
        }

        ul {
            list-style: none;
            margin: 0 0 3.2rem;
            padding: 0;
            text-align: left;

            @include r(768) {
                margin: 0 auto 3.2rem;
                max-width: 40rem;
            }
        }

        li {
            align-items: flex-start;
            display: flex;
            margin-bottom: 2.4rem;

            img {
                flex-shrink: 0;
                height: 2.8rem;
                margin: .4rem 1.6rem 0 0;
                width: 2.8rem;
            }
        }

        button {
            margin: 0 auto 2.4rem;
            max-width: 40rem;
            width: 100%;

            @include r(768) {
                margin-bottom: .8rem;
            }
        }

        .small {
            font-size: 1.4rem;
            margin-bottom: 0;
            opacity: .8;
        }

    }

    .tertiary {
        font-weight: bold;

        @include r(768) {
            left: 0;
            margin: -7.2rem auto 0;
            position: absolute;
            right: 0;
        }
    }
</style>
