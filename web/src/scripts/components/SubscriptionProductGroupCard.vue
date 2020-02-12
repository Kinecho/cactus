<template>
    <section class="tab-panel" :class="['tier-' + productGroup.tier, `display-index-${displayIndex}`]" >
        <h3 class="tab-header">{{tierName}}</h3>
        <ul>
            <li>Available on web, iOS, &amp;&nbsp;Android</li>
            <li>Unlimited reflection notes</li>
            <li>Daily reflection prompts</li>
            <li>256-bit encryption on&nbsp;notes</li>
            <li>Notifications via email &amp; push</li>
            <li class="heart">Supports Cactus development</li>
        </ul>
        <h4>Coming Soon</h4>
        <ul>
            <li>Personalized prompts</li>
            <li>Reminder scheduling</li>
            <li>Backup to DayOne, Dropbox,&nbsp;&amp;&nbsp&nbsp;more</li>
        </ul>
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
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import {SubscriptionProductGroup} from "@shared/util/SubscriptionProductUtil";
    import {subscriptionTierDisplayName} from "@shared/models/MemberSubscription";
    import SubscriptionProduct from "@shared/models/SubscriptionProduct";
    import CopyService from "@shared/copy/CopyService";
    import {LocalizedCopy} from "@shared/copy/CopyTypes";
    import {startCheckout} from "@web/checkoutService";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {

        },
        props: {
            productGroup: {type: Object as () => SubscriptionProductGroup, required: true},
            displayIndex: Number,
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
            selectedPrice(): string {
                return this.formatPrice(this.selectedProduct.priceCentsUsd)
            },
            buttonText(): string {
                if (this.selectedProduct.isFree) {
                    return copy.auth.SIGN_UP_FREE
                } else {
                    return `${copy.checkout.UPGRADE} — ${this.selectedPrice} / ${copy.checkout.BILLING_PERIOD_PER[this.selectedProduct.billingPeriod]}`
                }
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

    .tier-PLUS {

    }

    .tier-BASIC {

    }

    .tab-panel {
        grid-area: tabpanel;
        padding: 2.4rem 2.4rem 3.2rem;

        @include r(768) {
            padding: 3.2rem;

            &.tier-BASIC {
                align-self: end;
                background-color: $white;
                border-radius: 1.8rem 0 0 0;
                color: $darkestGreen;
                /*grid-area: tabpanel1;*/

                ul {
                    margin-bottom: 7.2rem;
                }
            }
            &.tier-PLUS {
                background-color: $darkestGreen;
                border-radius: 1.8rem 1.8rem 0 0;
                /*grid-area: tabpanel2;*/
            }

            &.display-index-0 {
                grid-area: tabpanel1;
            }

            &.display-index-1 {
                grid-area: tabpanel2;
            }

            &.display-index-3 {
                grid-area: tabpanel3;
            }

            &.display-index-4 {
                grid-area: tabpanel4;
            }
        }
        @include r(1140) {
            white-space: nowrap;
        }

        h4 {
            margin-bottom: 1.6rem;
        }

        ul {
            list-style: none;
            margin: 0 0 4rem -.6rem;
        }

        li {
            margin-bottom: 1.2rem;
            text-indent: -3.4rem;

            &:before {
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

        button {
            max-width: none;
            white-space: nowrap;
            width: 100%;
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
    }


</style>
