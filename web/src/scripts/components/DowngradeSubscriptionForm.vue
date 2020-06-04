<template>
    <div class="container">
        <template v-if="isStripeSubscription">
            <h2 class="areYouSure" v-if="!showCancelSuccess">Are you sure you want to cancel
                your&nbsp;subscription?</h2>
            <p v-if="!showConfirmCancel && !showCancelSuccess">{{message}}</p>
            <button class="red" @click="cancelStripeSubscription"
                    :disabled="loading"
                    v-if="!showCancelSuccess && !showConfirmCancel && !showCancelSuccess">
                Cancel Subscription
            </button>
            <h2 v-if="showCancelSuccess">Your cancellation has been successfully processed.</h2>
            <button @click="$emit('close')" v-if="showCancelSuccess" >Done</button>
        </template>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from "@shared/copy/CopyService";
    import { CommonCopy } from '@shared/copy/CopyTypes';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";
    import { PageRoute } from '@shared/PageRoutes';
    import { cancelStripeSubscription } from "@web/checkoutService";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {

        },
        props: {
            member: Object as () => CactusMember,
            nextBillingDateString: { type: String, required: false },
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
            message(): string {
                let message = "Please confirm your wish to cancel. You will continue to" +
                " have access to Cactus Plus until your current billing\xa0period ends";
                if (this.nextBillingDateString) {
                    message += " on " + this.nextBillingDateString
                }

                return message += ".";
            },
            body(): string {
                const member = this.member || CactusMemberService.sharedInstance.currentMember;
                return encodeURIComponent(`Hi,\n\nI'd like to cancel my Cactus ${ member?.tierDisplayName } subscription.\n\nThe email address on my account is ${ member.email } and my member ID is ${ member.id }.\n\nThanks,\n${ member.getFullName() }`.trim())
            }
        },
        methods: {
            async cancelStripeSubscription() {
                this.loading = true;
                this.showCancelSuccess = false;
                const cancelResponse = await cancelStripeSubscription();
                this.loading = false;
                if (cancelResponse.success) {
                    this.showCancelSuccess = true;
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
        margin: 2.4rem;
        max-width: 58rem;
        padding: 2.4rem 3.2rem;

        @include r(600) {
            margin: 0;
        }
        @include r(768) {
            max-width: 64rem;
            padding: 4.8rem;
        }

        h2 {
            border-radius: 1.2rem 1.2rem 0 0;
            font-size: 2.4rem;
            line-height: 1.3;
            margin-bottom: .8rem;

            &.areYouSure {
                color: $red;
            }
        }

        p {
            margin-bottom: 1.6rem;
            opacity: .9;
        }

        a {
            display: inline-block;
        }
    }

    button.remove {
        align-items: center;
        color: $red;
        display: flex;
        flex-grow: 0;

        img {
            height: 1.6rem;
            margin-right: .6rem;
            width: 1.6rem;
        }
    }
</style>
