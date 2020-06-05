<template>
    <div class="upsellContainer" v-if="product">
        <template v-if="upgradeSuccess">
            <h1>Upgrade Success!</h1>
            <p>You have successfully started your trial of Cactus Plus.</p>
            <button @click="$emit('next')">Continue</button>
        </template>
        <template v-else>
            <div class="alert error" v-if="errorMessage">{{errorMessage}}</div>
            <div class="textBox">
                <h2><markdown-text v-if="markdownText" :source="markdownText"/></h2>
                <div class="btnContainer">
                    <button class="tryIt" @click="checkout" :disabled="checkoutLoading">{{ctaText}}</button>
                    <router-link :to="pricingHref" tag="a" class="button tertiary" target="_blank">More info & other plans</router-link>
                </div>
                <p class="small">
                    Cactus Plus is free for days...
                </p>
            </div>
            <product-upsell-mini
                    class="upsellInfo"
                    :subscription-product="product"
                    cta-text="Try it free"
                    :checkout-loading="checkoutLoading"
                    @checkout="startCheckout"
            />
        </template>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import MarkdownText from "@components/MarkdownText.vue";
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import SubscriptionProduct from "@shared/models/SubscriptionProduct";
    import LoadableUpsell from "@components/gapanalysis/LoadableGapAnalysisUpsell.vue";
    import ProductUpsellMini from "@components/ProductUpsellMini.vue";
    import { CheckoutInfo } from "@components/onboarding/OnboardingTypes";
    import CactusMember from "@shared/models/CactusMember";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import { PageRoute } from "@shared/PageRoutes";

    @Component({
        components: {
            ProductUpsellMini,
            MarkdownText,
            LoadableUpsell,
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

    .small {
        font-size: 1.6rem;
        opacity: .8;
    }

    h2 {
        line-height: 1.2;
        margin-bottom: 2.4rem;
    }



    .upsellContainer {
        padding: 0 2.4rem;

        @include r(768) {
            align-items: center;
            display: flex;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        @include r(768) {
            padding-right: 6.4rem;
            width: 66%;
        }
    }

    .upsellInfo {
        @include shadowbox;
        font-size: 1.8rem;
        max-width: 30rem;
        padding: 3.2rem;
        width: 100%;

        @include r(768) {
            align-self: center;
            max-width: 33%;
        }
    }

    .btnContainer {
        align-items: center;
        display: flex;
        font-size: 1.8rem;
        margin-bottom: 4rem;

        .button {
            flex-grow: 0;
        }
    }

    .tryIt {
        flex-grow: 0;
        margin-right: 1.6rem;
        min-width: 24rem;
    }
</style>
