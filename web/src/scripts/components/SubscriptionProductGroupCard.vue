<template>
    <section class="tab-content" :class="[productGroup.tier.toLowerCase() + '-panel', `display-index-${displayIndex}`, {tabsOnMobile}]">

        <div class="comfort" v-if="startTrial">
            <span v-if="trialDurationMessage">{{trialDurationMessage}}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15">
                <path fill="#CC33A1" d="M8.246 1.33a4.54 4.54 0 116.423 6.424l-6.175 6.175a.699.699 0 01-.988 0L1.33 7.754A4.542 4.542 0 017.753 1.33L8 1.577l.246-.246z"/>
            </svg>
            Cancel anytime.
        </div>

        <markdown class="group-description" :source="groupDescriptionMarkdown" v-if="groupDescriptionMarkdown && !this.startTrial"/>

        <template v-for="(section, index) in sections" v-if="showFeatures">
            <h3 v-if="section.title">{{section.title}}</h3>
            <features :features="section.features"/>
        </template>

        <div v-if="isFree" class="freePrice">Free</div>

        <div class="flexContainer" v-if="productGroup.products.length > 1">
            <div v-for="product in productGroup.products"
                    class="planButton" :id="product.entryId"
                    :aria-controls="product.displayName"
                    @click="selectedProduct = product"
                    :class="{selected: isSelected(product)}"
                    :style="planButtonStyles"
            >
                <div class="cadence">{{copy.checkout.BILLING_PERIOD[product.billingPeriod]}}</div>
                <div class="planPrice">{{formatPrice(product.priceCentsUsd)}}</div>
                <div class="payment-period-per">per {{copy.checkout.BILLING_PERIOD_PER[product.billingPeriod]}}</div>
                <div class="savings" v-if="product.savingsCopy">
                    {{product.savingsCopy}}
                </div>
            </div>
        </div>

        <div class="actions">
            <div class="error" v-if="checkoutError">{{checkoutError}}</div>
            <button v-if="canPurchaseTier"
                    v-bind:disabled="isProcessing || isRestoringPurchases"
                    class="button primary loading-white"
                    :class="{secondary: selectedProduct.isFree}"
                    @click="checkout">
                {{buttonText}}
            </button>
            <button class="button btn secondary no-loading" v-if="isCurrentTier && !isTrialingTier" :disabled="true">
                {{copy.checkout.CURRENT_PLAN}}
            </button>

            <a :href="learnMorePath" v-if="showLearnMore" class="button btn secondary onDark">{{copy.common.LEARN_MORE}}</a>
        </div>
        <div v-if="footer && showFooter" class="group-footer" :class="{
            [`icon`]: footer.icon,
            [footer.icon]: footer.icon
        }">
            <markdown :source="footer.textMarkdown"/>
        </div>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import { SubscriptionProductGroupEntry } from "@shared/util/SubscriptionProductUtil";
    import { isOptInTrialing, subscriptionTierDisplayName } from "@shared/models/MemberSubscription";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import CopyService from "@shared/copy/CopyService";
    import { LocalizedCopy } from "@shared/copy/CopyTypes";
    import { startCheckout } from "@web/checkoutService";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import ProductFeatureList from "@components/ProductFeatureList.vue";
    import { ProductGroupFooter, ProductSection, SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import MarkdownText from "@components/MarkdownText.vue";
    import { PageRoute } from "@shared/PageRoutes";
    import CactusMember from "@shared/models/CactusMember";
    import Logger from "@shared/Logger";
    import { isNull, stringifyJSON } from "@shared/util/ObjectUtil";
    import { pushRoute } from "@web/NavigationUtil";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";
    import { isBlank } from "@shared/util/StringUtil";
    import PromotionalOfferManager from "@web/managers/PromotionalOfferManager";

    const copy = CopyService.getSharedInstance().copy;
    const logger = new Logger("SubscriptionProductGroupCard");

    @Component({
        components: {
            Features: ProductFeatureList,
            Markdown: MarkdownText,
        }
    })
    export default class SubscriptionProductGroupCard extends Vue {

        @Prop({ type: Object as () => SubscriptionProductGroupEntry, required: true })
        productGroup!: SubscriptionProductGroupEntry;

        @Prop({ type: Number, default: 0 })
        displayIndex!: number;

        @Prop({ type: Boolean, default: false })
        showFeatures!: boolean;

        @Prop({ type: Object as () => CactusMember | undefined, default: undefined })
        member!: CactusMember | undefined;

        @Prop({ type: Boolean, default: true })
        tabsOnMobile!: boolean;

        @Prop({ type: Boolean, default: false })
        learnMoreLinks!: boolean;

        @Prop({ type: Boolean, default: false })
        isRestoringPurchases!: boolean;

        @Prop({ type: Boolean, default: true })
        showFooter!: boolean;

        @Prop({ type: Boolean, default: false })
        startTrial!: boolean;

        @Prop({ type: String, required: false })
        checkoutSuccessUrl!: string;

        @Prop({ type: String, required: false, default: null })
        checkoutCancelUrl!: string | null;

        copy: LocalizedCopy = copy;

        selectedProduct: SubscriptionProduct = this.productGroup.products[0];
        isProcessing = false;
        checkoutError: string | null = null;

        get learnMorePath(): PageRoute {
            return PageRoute.PRICING
        }

        beforeMount() {
            this.selectedProduct = this.getSelectedProduct();
        }

        get planButtonStyles(): any {
            let numProducts = this.productGroup.products.length ?? 0;
            if (numProducts === 0) {
                numProducts = 1;
            }
            return {
                width: `${ (100 / numProducts) - 1 }%`,
            }
        }

        get tierName(): string | undefined {
            return subscriptionTierDisplayName(this.productGroup.tier);
        }

        get footer(): ProductGroupFooter | undefined {
            const offerTrialDays = PromotionalOfferManager.shared.getCurrentOffer(this.member)?.trialDays;
            const footer = this.productGroup.productGroup?.footer;

            if (isNull(offerTrialDays) || isBlank(footer?.textMarkdown)) {
                return footer;
            } else if (offerTrialDays > 1) {
                return { textMarkdown: `First ${ offerTrialDays } days free! Cancel anytime.` }
            } else if (offerTrialDays === 1) {
                return { textMarkdown: `First day free! Cancel anytime.` }
            }
            return undefined;

        }

        get groupDescriptionMarkdown(): string | undefined {
            if (this.isTrialingTier && this.productGroup.productGroup?.trialUpgradeMarkdown) {
                return this.productGroup.productGroup?.trialUpgradeMarkdown
            }
            return this.productGroup.productGroup?.descriptionMarkdown
        }

        get selectedPrice(): string {
            return this.formatPrice(this.selectedProduct.priceCentsUsd)
        }

        get isFree(): boolean {
            return this.selectedProduct?.isFree ?? false;
        }

        get trialDurationMessage(): string | null {
            return "First 7 days free!"
        }

        get buttonText(): string {
            if (this.isProcessing || this.isRestoringPurchases) {
                return copy.common.LOADING;
            }

            if (this.isNotCurrentTier && this.selectedProduct.isFree && !isOptInTrialing) {
                return copy.checkout.MANAGE_MY_PLAN;
            }
            if (this.selectedProduct.isFree) {
                return copy.auth.SIGN_UP_FREE;
            } else if (this.signedIn) {
                return `${ copy.checkout.TRY_CACTUS_PLUS }`;
            } else {
                return `${ copy.checkout.PURCHASE } — ${ this.selectedPrice } / ${ copy.checkout.BILLING_PERIOD_PER[this.selectedProduct.billingPeriod] }`
            }
        }

        get sections(): ProductSection[] {
            return this.productGroup.productGroup?.sections ?? [];
        }

        get isNotCurrentTier(): boolean {
            return this.signedIn && !this.isCurrentTier
        }

        get isCurrentTier(): boolean {
            return this.productGroup.tier === this.member?.tier;
        }

        get isOptInTrialing(): boolean {
            return this.member?.isOptInTrialing ?? false
        }

        get isTrialingTier(): boolean {
            return this.productGroup.tier === this.member?.tier && this.member?.isOptInTrialing;
        }

        get signedIn(): boolean {
            return !!this.member
        }

        get showLearnMore(): boolean {
            return this.learnMoreLinks && this.member && this.canPurchaseTier && this.productGroup.tier !== SubscriptionTier.BASIC || false;
        }

        get canPurchaseTier(): boolean {
            return (!this.isCurrentTier || this.isTrialingTier) && (!this.signedIn || this.productGroup.tier !== SubscriptionTier.BASIC)
        }

        get preSelectedProductEntryId(): string | null {
            return getQueryParam(QueryParam.SELECTED_PRODUCT);
        }

        get preSelectedProductTier(): string | null {
            return getQueryParam(QueryParam.SELECTED_TIER);
        }

        get preSelectedProductBillingPeriod(): string | null {
            return getQueryParam(QueryParam.SELECTED_PERIOD);
        }

        formatPrice(priceCents: number): string {
            return `$${ (priceCents / 100).toFixed(2) }`.replace(".00", "");
        }

        isSelected(product: SubscriptionProduct): boolean {
            return this.selectedProduct.entryId === product.entryId && this.canPurchaseTier;
        }

        getSelectedProduct(): SubscriptionProduct {
            return this.getPreSelectedProduct() ||
            this.productGroup.products.find(product => product.billingPeriod == this.productGroup.defaultSelectedPeriod) ||
            this.productGroup.products[0];
        }

        getPreSelectedProduct(): SubscriptionProduct | undefined {
            const tier = SubscriptionTier[this.preSelectedProductTier as keyof typeof SubscriptionTier];
            const period = BillingPeriod[this.preSelectedProductBillingPeriod as keyof typeof BillingPeriod];

            if (this.preSelectedProductEntryId) {
                return this.productGroup.products.find(product => product.entryId == this.preSelectedProductEntryId);
            } else if (tier && period) {
                return this.productGroup.products.find(product => product.billingPeriod == period && product.subscriptionTier == tier);
            }

            return undefined;
        }

        async checkout() {
            //todo
            this.isProcessing = true;

            const product = this.selectedProduct;

            if (this.isCurrentTier && !this.isOptInTrialing) {
                await this.goToAccount()
                return;
            }

            if (product.isFree && !this.signedIn) {
                await this.goToSignup();
                return;
            }

            const subscriptionProductId = product.entryId;
            if (!subscriptionProductId) {
                this.checkoutError = "The product does not have an entry id. Can not continue checkout";
                console.log(this.checkoutError);
                this.isProcessing = false;
                return;
            }

            const successUrl = this.checkoutSuccessUrl;
            const cancelUrl = this.checkoutCancelUrl;
            const checkoutResult = await startCheckout({
                subscriptionProductId,
                subscriptionProduct: product,
                stripeSuccessUrl: successUrl,
                stripeCancelUrl: cancelUrl
            });
            if (!checkoutResult.success && !checkoutResult.canceled) {
                logger.error("failed to load checkout", stringifyJSON(checkoutResult, 2));
                this.checkoutError = "Unable to load checkout. Please try again later";
                this.isProcessing = false;
            } else {
                this.isProcessing = false;
                this.checkoutError = null;
            }
        }

        async goToAccount() {
            this.isProcessing = false;
            await pushRoute(PageRoute.ACCOUNT)
        }

        async goToSignup() {
            this.isProcessing = false;
            await pushRoute(PageRoute.SIGNUP);
        }
    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .tab-content {
        color: $white;
        border-radius: 0 0 1.6rem 1.6rem;
        position: relative;
        text-align: left;

        &:first-child:before {
            background: url(/assets/images/crosses.svg) 0 0/228px 216px no-repeat;
            bottom: -4rem;
            content: "";
            display: block;
            height: 216px;
            left: -28%;
            overflow: hidden;
            position: absolute;
            width: 228px;
            z-index: -1;
        }

        @include r(768) {
            border-radius: 0 0 1.6rem 1.6rem;
            flex-basis: 50%;
            margin: 0 1.6rem;
            padding: 0 2.4rem 3.2rem;

            &:only-child {
                flex-basis: 100%;
                margin: 0;
            }

            &:first-child:before {
                bottom: -6rem;
            }

            &.basic-panel {
                background: $white none;
                color: $darkestGreen;
            }
        }

        &.plus-panel {
            background: $dolphin url(/assets/images/grainy.png) repeat;
            color: $white;
        }

        &.basic-panel {
            background-color: $white;
            color: $darkestGreen;

            &.tabsOnMobile {
                background: $dolphin url(/assets/images/grainy.png) repeat;
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

        button,
        .button {
            max-width: none;
            white-space: nowrap;
            width: 100%;
        }

        .comfort {
            font-size: 1.4rem;
            margin: -2.4rem -1.6rem 0;
            padding: 1.6rem;
            text-align: center;

            @include r(600) {
                font-size: 1.6rem;
            }
            @include r(768) {
                margin: -0.8rem -1.6rem 0;
            }

            svg {
                display: inline-block;
                height: 1.4rem;
                margin: 0 0.8rem;
                vertical-align: middle;
                width: 1.4rem;
            }
        }
    }

    button:disabled {
        background-color: transparent;
        color: transparentize($white, 0.4);
        @include r(768) {
            .basic-panel & {
                color: transparentize($darkestGreen, 0.4);
            }
        }
    }

    .flex-plans .basic-panel .actions .button:disabled {
        color: transparentize($darkestGreen, 0.4);
    }

    .actions .button {
        display: block;
        margin-bottom: 0.8rem;
    }

    .actions .error {
        background: lighten($red, 20%) url(/assets/images/sadCactusPatternWhiteTransparent.svg);
        border-radius: 0.8rem;
        color: $dolphin;
        margin-bottom: 1.6rem;
        padding: 1.6rem;
        text-align: center;
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
        background-color: transparentize($white, 0.9);
        border: 2px solid $dolphin;
        border-radius: 0.8rem;
        cursor: pointer;
        font-size: 1.6rem;
        padding: 0.8rem;
        text-align: center;
        width: 49%;

        &.selected {
            border-color: $green;
            box-shadow: inset 0 0 0 0.4rem $dolphin;
        }
    }

    .cadence {
        font-size: 1.2rem;
        letter-spacing: 1px;
        opacity: 0.8;
        text-transform: uppercase;
    }

    .planPrice,
    .freePrice {
        font-size: 2rem;
    }

    .freePrice {
        height: 14rem;
        margin-bottom: 2.4rem;
    }

    .payment-period-per {
        font-size: 1.4rem;
        text-transform: lowercase;
    }

    .savings {
        background-color: transparentize($royal, 0.4);
        border-radius: 0 0 0.8rem 0.8rem;
        font-size: 1.4rem;
        font-weight: bold;
        letter-spacing: 1px;
        margin: 0.8rem -0.8rem -0.8rem;
        padding: 0.4rem 0.8rem;
        text-transform: uppercase;
    }

    .group-footer {
        align-items: center;
        display: flex;
        font-size: 1.4rem;
        justify-content: center;

        &.icon {
            &:before {
                content: "";
                margin-right: 0.6rem;
            }

            &.heart:before {
                background: url(/assets/icons/heart.svg) no-repeat;
                height: 1.4rem;
                width: 1.6rem;
            }
        }
    }
</style>
