<template>
    <div class="container">
        <h2>Change Your Plan</h2>
        <p v-if="!showConfirmCancel">To change your plan, please send us an email to
            <a :href="`mailto:help@cactus.app?subject=${subject}`">help@cactus.app</a>. You&nbsp;can view your options
            on the <a :href="pricingRoute" target="_blank">{{commonCopy.PRICING}}</a>&nbsp;page. All&nbsp;requests are
            processed within 24&nbsp;hours.</p>
        <div v-if="isStripeSubscription">
            <div class="info" v-if="showConfirmCancel && !showCancelSuccess">{{confirmCancelMessage}}</div>
            <div class="info" v-if="showCancelSuccess">Your cancellation has been successfully processed.</div>
            <button class="btn danger" @click="cancelStripeSubscription" v-if="!showCancelSuccess">{{
                showConfirmCancel ? 'Yes, cancel subscription' : 'Cancel Subscription'
                }}
            </button>
            <button v-if="showCancelSuccess" @click="$emit('close')">Done</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from "@shared/copy/CopyService";
    import { CommonCopy } from '@shared/copy/CopyTypes';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";
    import { PageRoute } from '@shared/PageRoutes';
    import { formatDate } from "@shared/util/DateUtil";
    import { cancelStripeSubscription } from "@web/checkoutService";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {

        },
        props: {
            member: Object as () => CactusMember,
            nextBillingDate: { type: Object as () => Date | undefined, required: false },
        },
        data(): {
            pricingRoute: string,
            commonCopy: CommonCopy,
            showConfirmCancel: boolean,
            loading: boolean,
            showCancelSuccess: boolean,
        } {
            return {
                pricingRoute: PageRoute.PRICING,
                commonCopy: copy.common,
                showConfirmCancel: false,
                loading: false,
                showCancelSuccess: false,
            }
        },
        computed: {
            subject(): string {
                const member = this.member || CactusMemberService.sharedInstance.currentMember;
                return encodeURIComponent(`Change Plan for ${ member.email } (${ member.id })`)
            },
            isStripeSubscription(): boolean {
                return !!this.member?.subscription?.stripeSubscriptionId
            },
            confirmCancelMessage(): string {
                let message = "Please confirm you would like to cancel your subscription. You will continue have access until the current billing period ends";
                if (this.nextBillingDate) {
                    message += " on " + formatDate(this.nextBillingDate, copy.settings.dates.shortFormat) + ".";
                } else {
                    message += ".";
                }

                return message;
            },
            body(): string {
                const member = this.member || CactusMemberService.sharedInstance.currentMember;
                return encodeURIComponent(`Hi,\n\nI'd like to cancel my Cactus ${ member?.tierDisplayName } subscription.\n\nThe email address on my account is ${ member.email } and my member ID is ${ member.id }.\n\nThanks,\n${ member.getFullName() }`.trim())
            }
        },
        methods: {
            async cancelStripeSubscription() {
                if (this.showConfirmCancel) {
                    this.loading = true;
                    this.showCancelSuccess = false;
                    const cancelResponse = await cancelStripeSubscription();
                    this.loading = false;
                    if (cancelResponse.success) {
                        this.showCancelSuccess = true;
                    }
                } else {
                    this.showConfirmCancel = true;
                    this.loading = false;
                    this.showCancelSuccess = false;
                }

            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .container {
        @include shadowbox();
        background: $royal url(assets/images/plusBg.svg) center top/135% auto no-repeat;
        color: $white;
        margin: 2.4rem;
        max-width: 58rem;
        padding: 2.4rem 3.2rem;

        @include r(600) {
            margin: 0;
        }
        @include r(768) {
            background-size: 105% auto;
            max-width: 64rem;
            padding: 4.8rem;
        }

        h2 {
            border-radius: 1.2rem 1.2rem 0 0;
            margin-bottom: .8rem;

            @include r(768) {
                margin-bottom: 0;
            }
        }

        p {
            opacity: .9;
        }

        a {
            color: $white;
        }
    }

    .info {
        padding: 1rem;
        border-radius: 1rem;
        border-width: 0;
        border-style: solid;
        margin-bottom: 2rem;
        background-color: $lightGreen;
        color: $darkestGreen;
        border-color: $darkestGreen;
    }
</style>
