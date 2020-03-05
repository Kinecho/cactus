<template>

    <div v-if="member.hasActiveSubscription">
        <div v-if="subscriptionDetailsLoading" class="loading-container">
            <spinner message="Loading subscription details..."/>
        </div>

        <div v-else>
            <h3 class="tier">{{tierName}}
                <button @click="downgrade" class="button tertiary small changePlan">Change Plan</button>
            </h3>
            <div v-if="error" class="error">
                {{error}}
            </div>
            <template v-if="!error">
                <p v-if="!subscriptionDetailsLoading">Your next <span v-if="billingPeriod">{{billingPeriod}}</span> bill is
                    for <strong>{{nextBillAmount}}</strong> on <strong>{{nextBillingDate}}</strong>.</p>
                <div class="card-info">
                    <img class="ccIcon" src="assets/icons/creditCard.svg" alt=""/>
                    <div class="cardDetails">
                        <span class="brand" v-if="cardBrandName">{{cardBrandName}}</span>
                        <span class="last4" v-if="last4">ending in {{last4}}</span>
                        <p class="wallet" v-if="digitalWallet && digitalWallet.displayName">
                            {{digitalWallet.displayName}}</p>
                    </div>
                    <button class="tertiary button updateBtn" @click="updatePaymentMethod" :disabled="loadingUpdatePaymentMethod">
                        <img class="penIcon" src="assets/images/pen.svg" alt="" v-if="!loadingUpdatePaymentMethod"/>
                        <span class="btnText" v-if="!loadingUpdatePaymentMethod">Update</span>
                        <span class="btnText loading" v-if="loadingUpdatePaymentMethod">Loading...</span>
                    </button>
                </div>
            </template>

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
        startStripeCheckoutSession
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
    import {SnackbarMessage} from "@components/SnackbarTypes";

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

    button.changePlan:hover {
        background: transparent;
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

    .card-info {
        @include accountBox;
        padding: 1.6rem;
    }

    .brand, .last4 {
        display: inline-block;
        font-weight: bold;
    }

    .wallet {
        font-size: 1.6rem;
        margin-bottom: 0;
        opacity: .8;
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
        margin-right: .8rem;
        width: 1.6rem;
    }

</style>
