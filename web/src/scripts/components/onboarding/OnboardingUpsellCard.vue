<template>
    <div v-if="product">
        <markdown-text v-if="markdownText" :source="markdownText"/>
        <product-upsell-mini
                :subscription-product="product"
                cta-text="Try it free"
                :checkout-loading="checkoutLoading"
                @checkout="startCheckout"
        />
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

        checkoutLoading = false

        get markdownText(): string | undefined {
            return this.card.getMarkdownText();
        }

        startCheckout() {
            this.checkoutLoading = true;

            setTimeout(() => {
                this.checkoutLoading = false;
                this.purchaseSuccess();
            }, 2000)
        }

        purchaseSuccess() {
            this.$emit("next");
        }

    }
</script>

<style scoped lang="scss">

</style>