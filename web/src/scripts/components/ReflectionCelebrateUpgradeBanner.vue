<template>
    <div class="celebrateUpgrade" v-if="showUpgradeBanner" @click="goToPricing">
        {{cta}}
        <a :href="upgradeRoute">Learn More</a>
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
                upgradeRoute: PageRoute.PRICING
            }
        },
        computed: {
            isTrialing(): boolean {
                return this.member?.isOptInTrialing;
            },
            trialDaysLeftHeader(): string {
                if (this.member?.daysLeftInTrial) {
                    const days = this.member?.daysLeftInTrial;
                    if (days === 1) {
                        return 'Free access to Plus ends today';
                    } else {
                        return days + ' days left of free Cactus Plus access';
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
                return (tier === SubscriptionTier.BASIC || this.member?.isOptInTrialing) ? true : false;
            }
        },
        methods: {
            goToPricing() {
                window.location.href = PageRoute.PRICING;
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .celebrateUpgrade {
        background: $royal url(assets/images/plusBg.svg) center top/105% auto no-repeat;
        color: $white;
        cursor: pointer;
        padding: 1.6rem 4rem;

        @include r(600) {
            padding: 1.6rem 2.4rem;
        }

        a {
            @include fancyLinkLight;
            margin-left: .8rem;
            white-space: nowrap;
        }
    }

</style>
