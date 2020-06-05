<template>
    <div v-if="product">
        <template v-if="upgradeSuccess">
            <h1>Upgrade Success!</h1>
            <p>You have successfully started your trial of Cactus Plus.</p>

            <button @click="$emit('next')">Continue</button>
        </template>
        <template v-else>
            <div class="alert error" v-if="errorMessage">{{errorMessage}}</div>
            <markdown-text v-if="markdownText" :source="markdownText"/>
            <product-upsell-mini
                    :subscription-product="product"
                    cta-text="Try it free"
                    :checkout-loading="checkoutLoading"
                    @checkout="startCheckout"
            />

            <router-link :to="pricingHref" tag="a" class="fancyLink" target="_blank">More info & other plans
            </router-link>
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

    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .fancyLink {
        @include fancyLink;
        font-size: 1.4rem;
    }
</style>