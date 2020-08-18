<template>
    <div class="onboardingUpsellCard" v-if="product">
        <div class="successContainer" v-if="upgradeSuccess">
            <h1>Success!</h1>
            <p class="subtext">You have successfully started your trial of Cactus Plus.</p>
            <button class="continue" @click="$emit('next')">Continue</button>
        </div>
        <template v-else>
            <div class="alert error" v-if="errorMessage">{{errorMessage}}</div>
            <div class="upsellContainer">
                <h2>
                    <markdown-text v-if="markdownText" :source="markdownText"/>
                </h2>
                <ul class="upsellInfo">
                    <li>
                        <svg-icon icon="heartOutline" class="icon"/>
                        <span><strong>Personalized questions</strong> based on your core values</span>
                    </li>
                    <li>
                        <svg-icon icon="pie" class="icon"/>
                        <span><strong>Personal insights</strong> showing the things that make you happy</span>
                    </li>
                    <li>
                        <svg-icon icon="checkCircle" class="icon"/>
                        <span><strong>Personality tests</strong> to help you better know&nbsp;yourself</span>
                    </li>
                </ul>
                <div class="btnContainer">
                    <button class="tryIt" @click="checkout" :disabled="checkoutLoading">{{ctaText}}</button>
                    <router-link :to="pricingHref" tag="a" class="moreInfo button tertiary" target="_blank">More info &
                        other plans
                    </router-link>
                    <p class="finePrint" v-if="trialDays && trialDays > 0">
                        Cactus Plus is free for {{trialDays}} days, then {{pricePerMonth}} /
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

        @Prop({ type: String, default: "Try It Free" })
        ctaText!: string;

        get upgradeSuccess(): boolean {
            return isPremiumTier(this.member.tier) || (this.checkoutInfo?.success ?? false)
        }

        get checkoutLoading(): boolean {
            return this.checkoutInfo?.loading ?? false;
        }

        get markdownText(): string | undefined {
            // return this.card.getMarkdownText();
            if (this.trialDays && this.trialDays > 0) {
                return `Discover the rest of your core values when you start a free ${this.trialDays}-day trial`
            }
            return `Discover the rest of your core values when you upgrade to Cactus Plus`
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

        get trialDays(): number | null {
            if (this.member.currentOffer?.trialDays) {
                return this.member.currentOffer.trialDays;
            }
            return this.product?.trialDays ?? null
        }

        get isAnnualBilling(): boolean {
            return this.product?.billingPeriod === BillingPeriod.yearly;
        }

        checkout() {
            this.$emit('checkout', this.product);
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .successContainer {
        align-items: flex-start;
        display: flex;
        flex-flow: column wrap;
        justify-content: center;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            margin: 0 auto;
            max-width: 48rem;
            padding: 0 2.4rem;
        }
        @include r(768) {
            max-width: 84rem;
            padding: 0 6.4rem;
        }

        button {
            bottom: 2.4rem;
            left: 2.4rem;
            margin: auto;
            position: fixed;
            right: 2.4rem;
            width: calc(100% - 4.8rem);

            @include r(374) {
                bottom: 4rem;
                left: 4rem;
                right: 4rem;
                width: calc(100% - 8rem);
            }
            @include r(600) {
                flex-grow: 0;
                margin: 0;
                min-width: 24rem;
                position: static;
                width: auto;
            }
        }
    }

    .subtext {
        margin-bottom: 2.4rem;
    }

    .upsellContainer {
        @include r(374) {
            margin: 0 auto;
            max-width: 44rem;
            padding: 0 2.4rem;
        }
        @include r(960) {
            display: grid;
            grid-column-gap: 1.6rem;
            grid-template-rows: 1fr 1fr;
            grid-template-columns: 60% 40%;
            max-width: 110rem;
            padding: 0 6.4rem;
        }
        @include r(1140) {
            grid-column-gap: 6.4rem;
            grid-template-columns: 66% 33%;
            grid-template-rows: 1fr 1fr;
        }
    }

    h2 {
        line-height: 1.2;
        margin-bottom: 2rem;

        @include r(960) {
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
        @include r(960) {
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
        @include r(960) {
            align-items: center;
            align-self: start;
            display: flex;
            flex-wrap: wrap;
            font-size: 1.8rem;
            margin-bottom: 4rem;

            .tryIt {
                margin-right: 1.6rem;
                min-width: 24rem;
            }
        }

        .tryIt,
        .button {
            display: block;
            width: 100%;

            @include r(768) {
                max-width: none;
            }
            @include r(960) {
                flex-grow: 0;
                max-width: 28rem;
                width: auto;
            }
        }
    }

    a.button.moreInfo {
        color: $darkerGreen;
    }

    .finePrint {
        font-size: 1.4rem;
        opacity: .8;
        padding-top: 2.4rem;
        text-align: center;
        width: 100%;

        @include r(960) {
            font-size: 1.6rem;
            padding-top: 3.2rem;
            text-align: left;
        }
    }

</style>
