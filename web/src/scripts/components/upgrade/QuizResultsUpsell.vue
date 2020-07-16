<template>
    <div class="upsellContainer">
        <template v-if="element">
            <ResultElement :element="element" :selectable="false"/>
            <p class="subtext">To <strong>get your quiz results</strong>, try Cactus Plus. You'll also get access&nbsp;to:</p>
        </template>
        <p class="subtext" v-else>To <strong>get your quiz results</strong>, try Cactus Plus. You’ll also get access&nbsp;to:</p>
        <section class="features">
            <ul>
                <li>
                    <svg-icon icon="heartOutline" class="icon"/>
                    <span><strong>Personalized</strong> journal app with daily questions to reflect&nbsp;on</span>
                </li>
                <li>
                    <svg-icon icon="pie" class="icon"/>
                    <span><strong>Insights dashboard</strong>, showing the things that make you&nbsp;happy</span>
                </li>
                <li>
                    <svg-icon icon="checkCircle" class="icon"/>
                    <span><strong>Personality tests</strong> to help you better know&nbsp;yourself</span>
                </li>
            </ul>
            <transition name="component-fade" appear mode="out-in">
                <div v-if="loading" key="loading">
                    <spinner message="Loading..." :delay="1200"/>
                </div>
                <div v-else key="checkout-info" class="checkout-info">
                    <button @click="checkout" :disabled="checkoutLoading">Try it free</button>
                    <p class="small" v-if="subscriptionProduct.trialDays && subscriptionProduct.trialDays > 0">
                        Cactus Plus is free for {{subscriptionProduct.trialDays}} days, then {{pricePerMonth}} /
                        {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. No commitment. Cancel anytime.
                    </p>
                    <p class="small" v-else>
                        Cactus Plus is {{pricePerMonth}} /
                        {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. Cancel&nbsp;anytime.
                    </p>
                </div>
            </transition>
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

        @Prop({ type: String as () => CactusElement, required: false, default: null })
        element!: CactusElement|null;

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
    @import "styles/variables";
    @import "styles/mixins";
    @import "styles/transitions";

    .upsellContainer {
        padding: 6.4rem 2.4rem;
        text-align: center;
        @include r(768) {
            background: $beige;
            padding: 6.4rem 0 0;
        }
    }

    em {
        background: linear-gradient(rgba(101, 144, 237, 0.6), rgba(101, 144, 237, 0.6)) 0 90%/100% 0.8rem no-repeat;
        font-style: normal;
        padding: .2rem;
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

        .checkout-info {
            p {
                max-width: 40rem;
                margin: 0 auto;
            }
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
