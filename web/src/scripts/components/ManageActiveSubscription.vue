<template>

    <div v-if="member.hasActiveSubscription">
        <div v-if="subscriptionDetailsLoading" class="loading-container">
            <spinner message="Loading Subscription Details"/>
        </div>
        <div v-else>
            <h3 class="tier">{{tierName}}</h3>
            <h3 v-if="billingPeriod">{{billingPeriod}}</h3>
            <p v-if="!subscriptionDetailsLoading">Your next bill is for {{nextBillAmount}} on {{nextBillingDate}}</p>
            <div class="card-info">
                <svg width="20px" height="16px" viewBox="0 0 20 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <title>credit_card</title>
                    <g id="Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="Outlined" transform="translate(-306.000000, -246.000000)">
                            <g id="Action" transform="translate(100.000000, 100.000000)">
                                <g id="Outlined-/-Action-/-credit_card" transform="translate(204.000000, 142.000000)">
                                    <g>
                                        <polygon id="Path" points="0 0 24 0 24 24 0 24"></polygon>
                                        <path d="M20,4 L4,4 C2.89,4 2.01,4.89 2.01,6 L2,18 C2,19.11 2.89,20 4,20 L20,20 C21.11,20 22,19.11 22,18 L22,6 C22,4.89 21.11,4 20,4 Z M20,18 L4,18 L4,12 L20,12 L20,18 Z M20,8 L4,8 L4,6 L20,6 L20,8 Z" id="🔹-Icon-Color" fill="#1D1D1D"></path>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
                <span class="brand" v-if="cardBrandName">{{cardBrandName}}</span>
                <span class="last4" v-if="last4">&bull;&bull;&bull;&bull;{{last4}}</span>
                <span class="wallet" v-if="digitalWallet && digitalWallet.displayName">{{digitalWallet.displayName}}</span>
            </div>

            <button class="secondary button small" @click="updatePaymentMethod" :disabled="loadingUpdatePaymentMethod">
                Update Payment Method
            </button>

            <button @click="downgrade" class="button tertiary small">Downgrade to {{basicTierName}}</button>

            <modal :show="showDowngradeModal" :show-close-button="true" @close="showDowngradeModal=false">
                <downgrade-form slot="body" :member="member"/>
            </modal>

        </div>

    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import {subscriptionTierDisplayName} from "@shared/models/MemberSubscription";
    import Modal from "@components/Modal.vue";
    import DowngradeSubscriptionForm from "@components/DowngradeSubscriptionForm.vue";
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import {
        getSubscriptionDetails,
        getUpdatePaymentMethodSession,
        redirectToStripeCheckout,
        startCheckout, startStripeCheckoutSession
    } from "@web/checkoutService";
    import {formatDate} from "@shared/util/DateUtil";
    import {SubscriptionDetails} from "@shared/models/SubscriptionTypes";
    import CopyService from "@shared/copy/CopyService";
    import {
        DigitalWalletDetails,
        getBrandDisplayName,
        getDigitalWalletDetails
    } from "@shared/util/SubscriptionProductUtil";
    import Spinner from "@components/Spinner.vue";
    import SnackbarContent, {SnackbarMessage} from "@components/SnackbarContent.vue";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
            DowngradeForm: DowngradeSubscriptionForm,
            Spinner,
        },
        props: {
            member: {type: Object as () => CactusMember, required: true}
        },
        data(): {
            showDowngradeModal: boolean,
            subscriptionDetailsLoading: boolean,
            subscriptionDetails: SubscriptionDetails | undefined,
            loadingUpdatePaymentMethod: boolean,
        } {
            return {
                showDowngradeModal: false,
                subscriptionDetailsLoading: false,
                subscriptionDetails: undefined,
                loadingUpdatePaymentMethod: false,
            }
        },
        beforeMount(): void {
            this.fetchSubscriptionDetails();
        },
        computed: {
            nextBillingDate(): string | undefined {
                const nextDateSeconds = this.subscriptionDetails?.upcomingInvoice?.nextPaymentDate_epoch_seconds;
                if (nextDateSeconds) {
                    return formatDate(new Date(nextDateSeconds * 1000), copy.settings.dates.shortFormat)
                }
                return;
            },
            nextBillAmount(): string | undefined {
                const amount = this.subscriptionDetails?.upcomingInvoice?.amountCentsUsd;
                if (!amount) {
                    return;
                }
                if (amount % 100 === 0) {
                    return `$${amount / 100}`;
                }
                return `$${(amount / 100).toFixed(2)}`
            },
            cardBrandName(): string | undefined {
                return getBrandDisplayName(this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card?.brand);
            },
            last4(): string | undefined {
                return this.subscriptionDetails?.upcomingInvoice?.defaultPaymentMethod?.card?.last4;
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
            }
        }, methods: {
            async downgrade() {
                this.showDowngradeModal = true;
            },
            async fetchSubscriptionDetails() {
                if (!this.member || !this.member.hasActiveSubscription) {
                    this.subscriptionDetails = undefined;
                    return;
                }
                this.subscriptionDetailsLoading = true;
                this.subscriptionDetails = await getSubscriptionDetails();
                this.subscriptionDetailsLoading = false;
            },
            handleError(error: SnackbarMessage): void {
                //todo: handle error
                this.$emit("error", error);
            },
            async updatePaymentMethod() {
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
        margin-bottom: .8rem;
    }

    p {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

    .loading-container {
        align-items: flex-start;
        justify-content: flex-start;
        display: flex;
    }

</style>
