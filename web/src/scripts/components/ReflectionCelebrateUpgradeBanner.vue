<template>
    <div>
        <div class="celebrateUpgrade" v-if="showUpgradeBanner" @click="showPricingModal">
            Get daily insights and more
            <a href="#" @click="showPricingModal">Try Cactus Plus</a>
        </div>
        <PricingModal
            :showModal="pricingModalVisible"
            @close="closePricingModal"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@shared/PageRoutes";
    import CactusMember from '@shared/models/CactusMember';
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import PricingModal from "@components/PricingModal.vue";

    export default Vue.extend({
        components: {
            PricingModal
        },
        props: {
            member: { type: CactusMember }
        },
        data(): {
            upgradeRoute: string,
            pricingModalVisible: boolean,
        } {
            return {
                upgradeRoute: PageRoute.PRICING,
                pricingModalVisible: false
            }
        },
        computed: {
            showUpgradeBanner(): boolean {
                const tier = this.member?.tier ?? SubscriptionTier.PLUS;
                return (tier === SubscriptionTier.BASIC) ? true : false;
            }
        },
        methods: {
            showPricingModal(): void {
                this.pricingModalVisible = true
            },
            closePricingModal(): void {
                this.pricingModalVisible = false;
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
