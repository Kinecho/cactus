<template>
    <div class="onboardingUpsellCard" v-if="product">
        <template v-if="upgradeSuccess">
            <h1>Upgrade Success!</h1>
            <p>You have successfully started your trial of Cactus Plus.</p>
            <button @click="$emit('next')">Continue</button>
        </template>
        <template v-else>
            <div class="alert error" v-if="errorMessage">{{errorMessage}}</div>
            <div class="upsellContainer">
                <h2><markdown-text v-if="markdownText" :source="markdownText"/></h2>
                <ul class="upsellInfo">
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
                <div class="btnContainer">
                    <button class="tryIt" @click="checkout" :disabled="checkoutLoading">{{ctaText}}</button>
                    <router-link :to="pricingHref" tag="a" class="button tertiary" target="_blank">More info & other plans</router-link>
                    <p class="finePrint" v-if="product.trialDays && product.trialDays > 0">
                        Cactus Plus is free for {{product.trialDays}} days, then {{pricePerMonth}} /
                        {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. No commitment. Cancel
                        anytime.
                    </p>
                    <p class="finePrint" v-else>
                        Cactus Plus is {{pricePerMonth}} /
                        {{displayPeriod}}<span v-if="isAnnualBilling"> (billed annually)</span>. Cancel&nbsp;anytime.
                    </p>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import MarkdownText from "@components/MarkdownText.vue";
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import LoadableUpsell from "@components/gapanalysis/LoadableGapAnalysisUpsell.vue";
    import ProductUpsellMini from "@components/ProductUpsellMini.vue";
    import { CheckoutInfo } from "@components/onboarding/OnboardingTypes";
    import CactusMember from "@shared/models/CactusMember";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import { PageRoute } from "@shared/PageRoutes";
    import { formatPriceCentsUsd } from "@shared/util/StringUtil";
    import SvgIcon from "@components/SvgIcon.vue";

    @Component({
        components: {
            ProductUpsellMini,
            MarkdownText,
            LoadableUpsell,
            SvgIcon,
        }
    })
    export default class OnboardingUpsellCard extends Vue {
        name = "OnboardingUpsellCard";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        @Prop({ type: Object as () => SubscriptionProduct, required: false, default: null })
        product!: SubscriptionProduct | null;

        @Prop({ type: Object as () => CheckoutInfo, required: false, default: null })
        checkoutInfo!: CheckoutInfo | null;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: String, default: "Try it free" })
        ctaText!: string;

        get upgradeSuccess(): boolean {
            return isPremiumTier(this.member.tier) || this.checkoutInfo?.success ?? false
        }

        get checkoutLoading(): boolean {
            return this.checkoutInfo?.loading ?? false;
        }

        get markdownText(): string | undefined {
            return this.card.getMarkdownText();
        }

        get errorMessage(): string | null {
            return this.checkoutInfo?.error ?? null;
        }

        get pricingHref(): string {
            return PageRoute.PRICING
        }

        get pricePerMonth(): string | undefined {
            if (!this.product) {
                return;
            }

            if (this.product?.billingPeriod === BillingPeriod.yearly) {
                return formatPriceCentsUsd(this.product.priceCentsUsd / 12);
            } else {
                return formatPriceCentsUsd(this.product.priceCentsUsd);
            }
        }

        get displayPeriod(): string {
            if (this.product?.billingPeriod !== BillingPeriod.weekly) {
                return "month"
            }
            return this.product.billingPeriod;
        }

        get isAnnualBilling(): boolean {
            return this.product?.billingPeriod === BillingPeriod.yearly;
        }

        startCheckout() {
            this.$emit('checkout');

            // setTimeout(() => {
            //     this.checkoutLoading = false;
            //     this.purchaseSuccess();
            // }, 2000)
        }

        purchaseSuccess() {
            this.$emit("next");
        }

        checkout() {
            this.$emit('checkout', this.subscriptionProduct);
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .upsellContainer {
        @include r(374) {
            margin: 0 auto;
            max-width: 44rem;
            padding: 0 2.4rem;
        }
        @include r(768) {
            display: grid;
            grid-column-gap: 1.6rem;
            grid-template-rows: 1fr 1fr;
            grid-template-columns: 60% 40%;
            max-width: 110rem;
            padding: 0 6.4rem;
        }
        @include r(1140) {
            grid-column-gap: 6.4rem;
        }
    }

    h2 {
        line-height: 1.2;
        margin-bottom: 2rem;

        @include r(768) {
            align-self: end;
            margin-bottom: 2.4rem;
        }
    }

    .upsellInfo {
        @include shadowbox;
        font-size: 1.6rem;
        list-style: none;
        margin: 0 0 3.2rem;
        padding: 2.4rem;
        text-align: left;
        width: 100%;

        @include r(374) {
            margin: 0 0 3.2rem;
            width: 100%;
        }
        @include r(600) {
            font-size: 1.8rem;
            padding: 3.2rem;
        }
        @include r(768) {
            align-self: center;
            grid-area: 1 / 2 / 3 / 2;
            margin: 0;
        }

        li {
            align-items: flex-start;
            display: flex;

            &:not(:last-child) {
                margin-bottom: 1.6rem;

                @include r(600) {
                    margin-bottom: 2.4rem;
                }
            }

            img {
                flex-shrink: 0;
                height: 1.8rem;
                margin: .4rem 1.6rem 0 0;
                width: 1.8rem;

                @include r(600) {
                    height: 2.8rem;
                    width: 2.8rem;
                }
            }
        }
    }

    .btnContainer {
        @include r(768) {
            align-items: center;
            align-self: start;
            display: flex;
            flex-wrap: wrap;
            font-size: 1.8rem;
            margin-bottom: 4rem;
        }

        .tryIt {
            @include r(768) {
                margin-right: 1.6rem;
                min-width: 24rem;
            }
        }

        .tryIt,
        .button {
            display: block;
            width: 100%;

            @include r(768) {
                flex-grow: 0;
                width: auto;
            }
        }
    }

    .finePrint {
        font-size: 1.4rem;
        opacity: .8;
        padding-top: 2.4rem;
        text-align: center;
        width: 100%;

        @include r(600) {
            font-size: 1.6rem;
            padding-top: 3.2rem;
            text-align: left;
        }
    }

</style>
