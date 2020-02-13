<template>
    <div class="upgrade-wrapper" v-if="showUpgradeBanner">
        <div class="upgrade-card">
            <div class="upgrade">
                <span>{{cta}}</span>
                <a :href="upgradeRoute">Learn More</a>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@shared/PageRoutes";
    import CactusMember from '@shared/models/CactusMember';
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    
    export default Vue.extend({
        created() {

        },
        props: {
            member: { type: CactusMember }
        },
        data(): {
            upgradeRoute: string
        } {
            return {
                upgradeRoute: PageRoute.PAYMENT_PLANS
            }
        },
        computed: {
            isTrialing(): boolean {
                return this.member?.isInTrial;
            },
            trialDaysLeftHeader(): string {
                if (this.member?.daysLeftInTrial) {
                    const days = this.member?.daysLeftInTrial;
                    if (days === 1) {
                        return 'Free access ends today';
                    } else {
                        return days + ' days of free access remaining';
                    }
                }
                return '';
            },
            cta(): string {
                if (this.isTrialing) {
                    return this.trialDaysLeftHeader;
                } else {
                    return "Get daily prompts";
                }
            },
            showUpgradeBanner(): boolean {
                const tier = this.member?.tier ?? SubscriptionTier.PLUS;
                return (tier === SubscriptionTier.BASIC || this.member?.isInTrial) ? true : false;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .upgrade-card {
        padding: 1.5rem;
        background: #2c3c94 url(/assets/images/premiumBG.png) no-repeat;
        color: $white;
        text-align: center;
        margin: 0 auto;
        a { 
            color: $white;
            margin-left: 1rem;
            display: inline-block; 
        }
    }

</style>

