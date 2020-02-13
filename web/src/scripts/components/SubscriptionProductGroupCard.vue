<template>
    <section class="tab-content" :class="[productGroup.tier.toLowerCase() + '-panel', `display-index-${displayIndex}`, {tabsOnMobile}]">

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
                <div class="cadence">{{copy.checkout.BILLING_PERIOD[product.billingPeriod]}}</div>
                <div class="planPrice">{{formatPrice(product.priceCentsUsd)}}</div>
                <div class="payment-period-per">per {{copy.checkout.BILLING_PERIOD_PER[product.billingPeriod]}}</div>
            </div>
        </div>

        <div class="actions">
            <button v-if="canPurchaseTier"
                    v-bind:disabled="isProcessing"
                    class="button primary"
                    :class="{secondary: selectedProduct.isFree}"
                    @click="checkout">
                {{buttonText}}
            </button>
            <button class="button btn secondary no-loading" v-if="isCurrentTier && !isTrialingTier" :disabled="true">
                {{copy.checkout.CURRENT_PLAN}}
            </button>

            <a :href="learnMorePath" v-if="showLearnMore" class="button btn secondary">{{copy.common.LEARN_MORE}}</a>
        </div>
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
    import {isInTrial, subscriptionTierDisplayName} from "@shared/models/MemberSubscription";
    import SubscriptionProduct from "@shared/models/SubscriptionProduct";
    import CopyService from "@shared/copy/CopyService";
    import {LocalizedCopy} from "@shared/copy/CopyTypes";
    import {startCheckout} from "@web/checkoutService";
    import ProductFeatureList from "@components/ProductFeatureList.vue";
    import {ProductGroupFooter, ProductSection, SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import MarkdownText from "@components/MarkdownText.vue";
    import {PageRoute} from "@shared/PageRoutes";
    import CactusMember from "@shared/models/CactusMember";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Features: ProductFeatureList,
            Markdown: MarkdownText,
        },
        props: {
            productGroup: {type: Object as () => SubscriptionProductGroupEntry, required: true},
            displayIndex: Number,
            showFeatures: {type: Boolean, default: false},
            member: {type: Object as () => CactusMember | undefined},
            tabsOnMobile: {type: Boolean, default: true},
            learnMoreLinks: {type: Boolean, default: false},
        },
        data(): {
            selectedProduct: SubscriptionProduct,
            copy: LocalizedCopy,
            isProcessing: boolean,
            checkoutError: string | undefined,
            learnMorePath: PageRoute,

        } {
            return {
                selectedProduct: this.productGroup.products[0],
                copy,
                isProcessing: false,
                checkoutError: undefined,
                learnMorePath: PageRoute.PAYMENT_PLANS,
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
                if (this.isTrialingTier && this.productGroup.productGroup?.trialUpgradeMarkdown) {
                    return this.productGroup.productGroup?.trialUpgradeMarkdown
                }
                return this.productGroup.productGroup?.descriptionMarkdown
            },
            selectedPrice(): string {
                return this.formatPrice(this.selectedProduct.priceCentsUsd)
            },
            buttonText(): string {
                if (this.isNotCurrentTier && this.selectedProduct.isFree && !isInTrial) {
                    return copy.checkout.MANAGE_MY_PLAN
                }
                if (this.selectedProduct.isFree) {
                    return copy.auth.SIGN_UP_FREE
                } else if (this.signedIn) {
                    return `${copy.checkout.UPGRADE}`;
                } else {
                    return `${copy.checkout.PURCHASE} — ${this.selectedPrice} / ${copy.checkout.BILLING_PERIOD_PER[this.selectedProduct.billingPeriod]}`
                }
            },
            sections(): ProductSection[] {
                return this.productGroup.productGroup?.sections ?? [];
            },
            isNotCurrentTier(): boolean {
                return this.signedIn && !this.isCurrentTier
            },
            isCurrentTier(): boolean {
                return this.productGroup.tier === this.member?.tier;
            },
            isInTrial(): boolean {
                return this.member?.isInTrial ?? false
            },
            isTrialingTier(): boolean {
                return this.productGroup.tier === this.member?.tier && this.member?.isInTrial;
            },
            signedIn(): boolean {
                return !!this.member
            },
            showLearnMore(): boolean {
                return this.learnMoreLinks && this.member && this.canPurchaseTier && this.productGroup.tier !== SubscriptionTier.BASIC || false;
            },
            canPurchaseTier(): boolean {
                return (!this.isCurrentTier || this.isTrialingTier ) && (!this.signedIn || this.productGroup.tier !== SubscriptionTier.BASIC)
            }
        },
        methods: {
            formatPrice(priceCents: number): string {
                return `$${(priceCents / 100).toFixed(2)}`.replace(".00", "");
            },
            isSelected(product: SubscriptionProduct): boolean {
                return this.selectedProduct !== undefined && this.selectedProduct?.entryId === product.entryId && this.canPurchaseTier;
            },
            async checkout() {
                //todo
                this.isProcessing = true;

                const product = this.selectedProduct;

                if (this.isNotCurrentTier) {
                    this.goToAccount()
                }

                if (product.isFree && !this.signedIn) {
                    this.goToSignup();
                    return;
                }

                const stripePlanId = product.stripePlanId;
                if (!stripePlanId) {
                    this.checkoutError = "The product does not have a plan id. Can not continue checkout";
                    console.log(this.checkoutError);
                    this.isProcessing = false;
                    return;
                }
                await startCheckout({stripePlanId})
            },
            goToAccount() {
                this.isProcessing = false;
                window.location.href = PageRoute.ACCOUNT;
            },
            goToSignup() {
                this.isProcessing = false;
                window.location.href = PageRoute.SIGNUP;
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .tab-content {
        background: $dolphin url(assets/images/grainy.png) repeat;
        box-shadow:
            0 11px 15px -7px rgba(0, 0, 0, .16),
            0 24px 38px 3px rgba(0, 0, 0, .1),
            0 9px 46px 8px rgba(0, 0, 0, .08);
        color: $white;
        border-radius: 0 0 1.6rem 1.6rem;
        padding: 2.4rem 2.4rem 3.2rem;
        text-align: left;

        @include r(768) {
            border-radius: 0 0 1.6rem 1.6rem;
            flex-basis: 50%;
            margin: 0 1.6rem;
            padding: 0 2.4rem 3.2rem;

            &.basic-panel {
                background: $white none;
                color: $darkestGreen;
            }

            &.plus-panel {
                background: $dolphin url(assets/images/grainy.png) repeat;
                color: $white;
            }
        }

        &.basic-panel {
            background-color: $white;
            color: $darkestGreen;

            &.tabsOnMobile {
                background: $dolphin url(assets/images/grainy.png) repeat;
                color: $white;

                @include r(768) {
                    background: $white;
                    color: $darkestGreen;
                }
            }
        }

        h4 {
            margin-bottom: 1.6rem;
        }

        button, .button {
            max-width: none;
            white-space: nowrap;
            width: 100%;
        }
    }

    .actions {
        display: flex;
        flex-direction: column;

        .button {
            margin-bottom: 1.6rem;
        }
    }

    .group-description {
        margin-bottom: 2.4rem;
    }

    .flexContainer {
        display: flex;
        margin-bottom: 2.4rem;
        justify-content: space-between;
    }

    .planButton {
        background-color: transparentize($white, .9);
        border: 2px solid $dolphin;
        border-radius: .8rem;
        cursor: pointer;
        font-size: 1.6rem;
        padding: .8rem;
        text-align: center;
        width: 49%;

        &.selected {
            border-color: $green;
            box-shadow: inset 0 0 0 .4rem $dolphin;
        }
    }

    .cadence {
        font-size: 1.4rem;
        letter-spacing: 1px;
        opacity: .8;
        text-transform: uppercase;
    }

    .planPrice {
        font-size: 2rem;
    }

    .payment-period-per {
        text-transform: lowercase;
    }

    .group-footer {
        align-items: center;
        display: flex;
        font-size: 1.4rem;
        justify-content: center;

        &.icon {
            &:before {
                content: "";
                margin-right: .6rem;
            }

            &.heart:before {
                background: url(assets/icons/heart.svg) no-repeat;
                height: 1.4rem;
                width: 1.6rem;
            }
        }
    }


</style>
