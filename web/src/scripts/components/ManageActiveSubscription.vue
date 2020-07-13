<template>
    <div v-if="member.hasActiveSubscription">
        <div v-if="subscriptionDetailsLoading" class="loading-container">
            <spinner message="Loading subscription details..."/>
        </div>

        <div v-else>
            <h3 class="tier">{{tierName}}
                <button @click="downgrade"
                        class="button tertiary small changePlan red"
                        v-if="isStripeSubscription && isAutoRenewable"
                >
                    Cancel Subscription
                </button>
            </h3>
            <div v-if="error" class="error">
                {{error}}
            </div>
            <template v-if="!error">
                <template v-if="!subscriptionDetailsLoading">
                    <p v-if="isExpired">
                        Your subscription ended on <strong>{{nextBillingDate}}</strong>.
                    </p>
                    <p v-else-if="isInOptOutTrial">
                        Your free trial ends on {{ optOutTrialEndsAt | formatDate }} and you will be billed <strong>{{nextBillAmount}}</strong>/{{
                        billingPeriodSingular | lowerCase}}.
                    </p>
                    <p v-else-if="isAutoRenewable">
                        Your next <span v-if="billingPeriod">{{billingPeriod}}</span> bill is for
                        <strong>{{nextBillAmount}}</strong> on <strong>{{nextBillingDate}}</strong>.</p>
                    <p v-else-if="!isAutoRenewable">
                        Your subscription will end on <strong>{{nextBillingDate}}</strong>. You will not be billed
                        again.
                    </p>

                </template>


                <div class="card-info apple-subscription" v-if="isAppleSubscription">
                    <img src="/assets/icons/apple.svg" class="ccIcon"/>
                    <div class="cardDetails"><a href="https://apps.apple.com/account/subscriptions" target="_blank">Manage
                        subscription</a> on iTunes
                    </div>
                </div>
                <div class="card-info apple-subscription" v-else-if="isGoogleSubscription">
                    <img src="/assets/icons/google_g.svg" class="ccIcon"/>
                    <div class="cardDetails"><a :href="googleSubscriptionUrl" target="_blank">Manage
                        subscription</a> on Google Play
                    </div>
                </div>
                <div class="card-info" v-if="showCardInfo">
                    <img class="ccIcon" src="/assets/icons/creditCard.svg" alt=""/>
                    <div class="cardDetails">
                        <span class="brand" v-if="cardBrandName">{{cardBrandName}}</span>
                        <span class="last4" v-if="last4"> ending in {{last4}}</span>
                        <p class="expires" v-if="cardExpiration">Expires: {{cardExpiration}}</p>
                        <p class="wallet" v-if="digitalWallet && digitalWallet.displayName">
                            {{digitalWallet.displayName}}</p>
                    </div>
                    <button class="tertiary button updateBtn" @click="updatePaymentMethod" :disabled="loadingUpdatePaymentMethod">
                        <img class="penIcon" src="/assets/images/pen.svg" alt="" v-if="!loadingUpdatePaymentMethod"/>
                        <span class="btnText" v-if="!loadingUpdatePaymentMethod">Update</span>
                        <span class="btnText loading" v-if="loadingUpdatePaymentMethod">Loading...</span>
                    </button>
                </div>
            </template>
        </div>
        <modal :show="showDowngradeModal" :show-close-button="true" @close="showDowngradeModal=false">
            <downgrade-form slot="body" :member="member" :next-billing-date-string="nextBillingDate" @close="showDowngradeModal=false"/>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import { BillingPlatform, subscriptionTierDisplayName } from "@shared/models/MemberSubscription";
    import Modal from "@components/Modal.vue";
    import DowngradeSubscriptionForm from "@components/DowngradeSubscriptionForm.vue";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import {
        getSubscriptionDetails,
        getUpdatePaymentMethodSession,
        startStripeCheckoutSession
    } from "@web/checkoutService";
    import { formatDate } from "@shared/util/DateUtil";
    import { SubscriptionDetails, SubscriptionStatus } from "@shared/models/SubscriptionTypes";
    import CopyService from "@shared/copy/CopyService";
    import {
        DigitalWalletDetails,
        getBrandDisplayName,
        getDigitalWalletDetails
    } from "@shared/util/SubscriptionProductUtil";
    import Spinner from "@components/Spinner.vue";
    import { appendQueryParams, isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"
    import { SnackbarMessage } from "@components/SnackbarContentTypes";

    const logger = new Logger("ManageActiveSubscription");
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
            DowngradeForm: DowngradeSubscriptionForm,
            Spinner,
        },
        props: {
            member: { type: Object as () => CactusMember, required: true }
        },
        data(): {
            showDowngradeModal: boolean,
            subscriptionDetailsLoading: boolean,
            subscriptionDetails: SubscriptionDetails | undefined,
            loadingUpdatePaymentMethod: boolean,
            error: string | undefined,
        } {
            return {
                showDowngradeModal: false,
                subscriptionDetailsLoading: false,
                subscriptionDetails: undefined,
                loadingUpdatePaymentMethod: false,
                error: undefined,
            }
        },
        beforeMount(): void {
            this.fetchSubscriptionDetails();
        },
        filters: {
            formatDate(date: Date | undefined): string | undefined {
                return formatDate(date, copy.settings.dates.shortFormat);
            },
            lowerCase(value?: string | undefined) {
                return value?.toLowerCase()
            }
        },
        watch: {
            member(current: CactusMember | undefined, previous: CactusMember | undefined) {
                if (current?.subscription?.cancellation?.accessEndsAt !== previous?.subscription?.cancellation?.accessEndsAt ||
                current?.subscription?.tier !== previous?.subscription?.tier) {
                    this.fetchSubscriptionDetails();
                }
            }
        },
        computed: {
            isExpired(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.isExpired ?? false
            },
            isInOptOutTrial(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.subscriptionStatus === SubscriptionStatus.in_trial;
            },
            billingPeriodEndDate(): Date | undefined {
                const endDate = this.subscriptionDetails?.upcomingInvoice?.nextPaymentDate_epoch_seconds;
                if (endDate) {
                    return new Date(endDate * 1000)
                }
                return;
            },
            optOutTrialEndsAt(): Date | undefined {
                const seconds = this.subscriptionDetails?.upcomingInvoice?.optOutTrialEndsAt_epoch_seconds;
                if (!seconds) {
                    return
                }
                return new Date(seconds * 1000);
            },
            isAutoRenewable(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.isAutoRenew ?? false
            },
            isAppleSubscription(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.isAppleSubscription ?? this.subscriptionDetails?.upcomingInvoice?.billingPlatform === BillingPlatform.APPLE ?? false
            },
            isGoogleSubscription(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.isGoogleSubscription ?? this.subscriptionDetails?.upcomingInvoice?.billingPlatform === BillingPlatform.GOOGLE ?? false
            },
            isStripeSubscription(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.billingPlatform === BillingPlatform.STRIPE ?? false
            },
            googleSubscriptionUrl(): string | undefined {
                const upcomingInvoice = this.subscriptionDetails?.upcomingInvoice;
                if (!upcomingInvoice || !this.isGoogleSubscription) {
                    return
                }
                const sku = upcomingInvoice.androidProductId;
                const packageName = upcomingInvoice.androidPackageName;
                const basUrl = "https://play.google.com/store/account/subscriptions";
                return appendQueryParams(basUrl, { sku, package: packageName });
            },
            showCardInfo(): boolean {
                return this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card !== undefined
            },
            nextBillingDate(): string | undefined {
                const nextDateSeconds = this.subscriptionDetails?.upcomingInvoice?.nextPaymentDate_epoch_seconds ?? this.subscriptionDetails?.upcomingInvoice?.periodEnd_epoch_seconds;
                if (nextDateSeconds) {
                    return formatDate(new Date(nextDateSeconds * 1000), copy.settings.dates.shortFormat)
                }
                return;
            },
            nextBillAmount(): string | undefined {
                let applePriceFormatted = this.subscriptionDetails?.upcomingInvoice?.appleProductPrice?.localePriceFormatted
                if (!isBlank(applePriceFormatted)) {
                    logger.info("Using apple price of: ", applePriceFormatted)
                    return applePriceFormatted
                }

                const amount = this.subscriptionDetails?.upcomingInvoice?.amountCentsUsd;
                if (!amount) {
                    return;
                }
                if (amount % 100 === 0) {
                    return `$${ amount / 100 }`;
                }
                return `$${ (amount / 100).toFixed(2) }`
            },
            cardBrandName(): string | undefined {
                return getBrandDisplayName(this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card?.brand);
            },
            last4(): string | undefined {
                return this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card?.last4;
            },
            cardExpiration(): string | undefined {
                const card = this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card;

                if (!card) {
                    return;
                }
                const month = card.expiryMonth;
                const year = card.expiryYear;
                if (month === undefined || year === undefined) {
                    return;
                }

                return `${ month < 10 ? "0" : "" }${ month }/${ year }`;
            },
            digitalWallet(): DigitalWalletDetails | undefined {
                return getDigitalWalletDetails(this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card?.walletType);
            },
            tierName(): string | undefined {
                return subscriptionTierDisplayName(this.member.tier)
            },
            basicTierName(): string {
                return subscriptionTierDisplayName(SubscriptionTier.BASIC)!
            },
            billingPeriod(): string | undefined {
                const period = this.subscriptionDetails?.subscriptionProduct?.billingPeriod;
                if (!period) {
                    return
                }
                return copy.checkout.BILLING_PERIOD[period];
            },
            billingPeriodSingular(): string | undefined {
                const period = this.subscriptionDetails?.subscriptionProduct?.billingPeriod;
                if (!period) {
                    return
                }
                return copy.checkout.BILLING_PERIOD_PER[period]
            }
        }, methods: {
            async downgrade() {
                this.showDowngradeModal = true;
            },
            async cancelStripeSubscription(): Promise<void> {

            },
            async fetchSubscriptionDetails() {
                if (!this.member || !this.member.hasActiveSubscription) {
                    this.subscriptionDetails = undefined;
                    return;
                }
                this.error = undefined;
                this.subscriptionDetailsLoading = true;
                this.subscriptionDetails = await getSubscriptionDetails();
                if (!this.subscriptionDetails) {
                    this.error = "Unable to load your subscription details. Please try again later";
                } else {
                    this.error = undefined;
                }
                this.subscriptionDetailsLoading = false;
            },
            handleError(error: SnackbarMessage): void {
                //todo: handle error
                this.$emit("error", error);
            },
            async updatePaymentMethod(): Promise<void> {
                this.loadingUpdatePaymentMethod = true;
                const sessionResponse = await getUpdatePaymentMethodSession({});
                if (!sessionResponse.success || !sessionResponse.sessionId) {
                    this.handleError({
                        message: "Unable to update payment method at this time. Please try again later.",
                        color: "danger"
                    });
                    this.loadingUpdatePaymentMethod = false;
                    return;
                }
                const redirectResponse = await startStripeCheckoutSession(sessionResponse.sessionId);
                if (redirectResponse.error) {
                    this.handleError({
                        message: "Unable to update payment method at this time. Please try again later.",
                        color: "danger"
                    });
                    this.loadingUpdatePaymentMethod = false;
                    return;
                }
                this.loadingUpdatePaymentMethod = true;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    h3 {
        margin-bottom: 0.8rem;
    }

    button.changePlan:hover {
        background: transparent;
    }

    p {
        margin-bottom: 1.6rem;
        opacity: 0.8;
    }

    .loading-container {
        align-items: flex-start;
        justify-content: flex-start;
        display: flex;
    }

    .card-info {
        @include accountBox;
        padding: 1.6rem;
    }

    .brand,
    .last4 {
        display: inline-block;
        font-weight: bold;
        padding-right: .4rem;
    }

    .wallet,
    .expires {
        font-size: 1.6rem;
        margin-bottom: 0;
        opacity: 0.8;
    }

    button.updateBtn {
        align-items: center;
        display: flex;
        flex-grow: 0;
        padding: 1.2rem 0 1.2rem 2.4rem;

        &:hover {
            background: transparent;
        }

        &:disabled:before {
            margin-top: 0;
        }
    }

    .btnText {
        display: none;

        @include r(374) {
            display: block;
        }

        &.loading {
            color: $lightText;
        }
    }

    .ccIcon {
        display: none;

        @include r(600) {
            display: block;
            height: 2.3rem;
            margin-right: 1.6rem;
            width: 3rem;
        }
    }

    .cardDetails {
        flex-grow: 1;
    }

    .penIcon {
        height: 1.6rem;
        margin-right: 0.8rem;
        width: 1.6rem;
    }
</style>
