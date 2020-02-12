<template>
    <section class="tab-content" :class="[productGroup.tier.toLowerCase() + '-panel', `display-index-${displayIndex}`]">

        <markdown class="group-description" :source="groupDescriptionMarkdown" v-if="groupDescriptionMarkdown"/>

        <template v-for="(section, index) in sections" v-if="showFeatures">
            <h3 v-if="section.title">{{section.title}}</h3>
            <features :features="section.features"/>
        </template>

        <div class="flexContainer" v-if="productGroup.products.length > 1">
            <div v-for="product in productGroup.products"
                    class="planButton" :id="product.entryId"
                    :aria-controls="product.displayName"
                    @click="selectedProduct = product"
                    :class="{selected: isSelected(product)}">
                <span>{{copy.checkout.BILLING_PERIOD[product.billingPeriod]}}</span>
                <span>{{formatPrice(product.priceCentsUsd)}}</span>
                <span class="payment-period-per">per {{copy.checkout.BILLING_PERIOD_PER[product.billingPeriod]}}</span>
            </div>
        </div>
        <button v-bind:disabled="isProcessing" :class="{secondary: selectedProduct.isFree}" @click="checkout">
            {{buttonText}}
        </button>
        <div v-if="footer" class="group-footer" :class="{
            [`icon`]: footer.icon,
            [footer.icon]: footer.icon
        }">
            <markdown :source="footer.textMarkdown"/>
        </div>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import {SubscriptionProductGroupEntry} from "@shared/util/SubscriptionProductUtil";
    import {subscriptionTierDisplayName} from "@shared/models/MemberSubscription";
    import SubscriptionProduct from "@shared/models/SubscriptionProduct";
    import CopyService from "@shared/copy/CopyService";
    import {LocalizedCopy} from "@shared/copy/CopyTypes";
    import {startCheckout} from "@web/checkoutService";
    import ProductFeatureList from "@components/ProductFeatureList.vue";
    import {ProductGroupFooter, ProductSection} from "@shared/models/SubscriptionProductGroup";
    import MarkdownText from "@components/MarkdownText.vue";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Features: ProductFeatureList,
            Markdown: MarkdownText,
        },
        props: {
            productGroup: {type: Object as () => SubscriptionProductGroupEntry, required: true},
            displayIndex: Number,
            showFeatures: {type: Boolean, default: false}
        },
        data(): {
            selectedProduct: SubscriptionProduct,
            copy: LocalizedCopy,
            isProcessing: boolean,
            checkoutError: string | undefined,
        } {
            return {
                selectedProduct: this.productGroup.products[0],
                copy,
                isProcessing: false,
                checkoutError: undefined,
            }
        },
        computed: {
            tierName(): string | undefined {
                return subscriptionTierDisplayName(this.productGroup.tier);
            },
            footer(): ProductGroupFooter | undefined {
                return this.productGroup.productGroup?.footer;
            },
            groupDescriptionMarkdown(): string | undefined {
                return this.productGroup.productGroup?.descriptionMarkdown
            },
            selectedPrice(): string {
                return this.formatPrice(this.selectedProduct.priceCentsUsd)
            },
            buttonText(): string {
                if (this.selectedProduct.isFree) {
                    return copy.auth.SIGN_UP_FREE
                } else {
                    return `${copy.checkout.UPGRADE} — ${this.selectedPrice} / ${copy.checkout.BILLING_PERIOD_PER[this.selectedProduct.billingPeriod]}`
                }
            },
            sections(): ProductSection[] {
                return this.productGroup.productGroup?.sections ?? [];
            }
        },
        methods: {
            formatPrice(priceCents: number): string {
                return `$${(priceCents / 100).toFixed(2)}`.replace(".00", "");
            },
            isSelected(product: SubscriptionProduct): boolean {
                return this.selectedProduct !== undefined && this.selectedProduct?.entryId === product.entryId;
            },
            async checkout() {
                //todo
                this.isProcessing = true;
                const product = this.selectedProduct;
                const stripePlanId = product.stripePlanId;
                if (!stripePlanId) {
                    this.checkoutError = "The product does not have a plan id. Can not continue checkout";
                    console.log(this.checkoutError);
                    this.isProcessing = false;
                    return;
                }
                await startCheckout({stripePlanId})
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .tab-content {
        display: none;
        padding: 0 2.4rem 3.2rem;

        @include r(768) {
            border-radius: 0 0 1.6rem 1.6rem;
            display: block;
            flex-basis: 50%;
            padding: 3.2rem;

            &.basic-panel {
                background-color: $white;
                color: $darkestGreen;

                ul {
                    margin-bottom: 7.2rem;
                }
            }

            &.plus-panel {
                background-color: $dolphin;
                color: $white;
            }
        }

        &.active {
            display: block;
        }

        h4 {
            margin-bottom: 1.6rem;
        }

        button {
            max-width: none;
            white-space: nowrap;
            width: 100%;
        }
    }

    .payment-period-per {
        text-transform: lowercase;
    }

    .flexContainer {
        display: flex;
        margin-bottom: 2.4rem;
        justify-content: space-between;

        .planButton {
            background-color: transparentize($white, .9);
            border: 2px solid $darkestGreen;
            border-radius: .8rem;
            cursor: pointer;
            font-size: 1.6rem;
            padding: .8rem;
            text-align: center;
            width: 49%;

            &.selected {
                border-color: $green;
                box-shadow: inset 0 0 0 .4rem $darkestGreen;
            }

            span {
                display: block;

                &:nth-child(1) {
                    font-size: 1.4rem;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                &:nth-child(2) {
                    font-size: 2rem;
                }
            }
        }
    }

    .group-footer {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        &.icon {
            &:before, &.check:before {
                background-image: url(assets/images/check.svg);
                background-repeat: no-repeat;
                background-size: contain;
                content: "";
                display: inline-block;
                height: 1.3rem;
                margin-right: 1.6rem;
                width: 1.8rem;

            }

            &.heart:before {
                background-image: url(assets/icons/heart.svg);
                height: 1.5rem;
            }
        }
    }


</style>
