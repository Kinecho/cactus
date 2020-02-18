<template>

    <div v-if="member.hasActiveSubscription">
        <div v-if="subscriptionDetailsLoading">
            LOADING
        </div>
        <h3 class="tier">{{tierName}}</h3>
        <p v-if="!subscriptionDetailsLoading">Your next bill is for {{nextBillAmount}} on {{nextBillingDate}}</p>

        <button @click="downgrade" class="button secondary small">Downgrade to {{basicTierName}}</button>

        <modal :show="showDowngradeModal" :show-close-button="true" @close="showDowngradeModal=false">
            <downgrade-form slot="body" :member="member"/>
        </modal>

    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import {subscriptionTierDisplayName} from "@shared/models/MemberSubscription";
    import Modal from "@components/Modal.vue";
    import DowngradeSubscriptionForm from "@components/DowngradeSubscriptionForm.vue";
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import {getSubscriptionDetails} from "@web/checkoutService";
    import {formatDate} from "@shared/util/DateUtil";
    import {SubscriptionDetails} from "@shared/models/SubscriptionTypes";
    import CopyService from "@shared/copy/CopyService";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
            DowngradeForm: DowngradeSubscriptionForm,
        },
        props: {
            member: {type: Object as () => CactusMember, required: true}
        },
        data(): {
            showDowngradeModal: boolean,
            subscriptionDetailsLoading: boolean,
            subscriptionDetails: SubscriptionDetails | undefined,
        } {
            return {
                showDowngradeModal: false,
                subscriptionDetailsLoading: false,
                subscriptionDetails: undefined,
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
            tierName(): string | undefined {
                return subscriptionTierDisplayName(this.member.tier)
            },
            basicTierName(): string {
                return subscriptionTierDisplayName(SubscriptionTier.BASIC)!
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


</style>
