<template>
    <div class="centered">
        <transition appear name="fade-in">
            <div class="flex-plans" v-if="productsLoaded && !tabsOnMobile">
                <div v-for="(productGroup, i) in productGroups" class="plan-container">
                        <span class="heading"
                                aria-controls="basic">{{getGroupDisplayName(productGroup)}}<span class="trial-badge"
                                v-if="showTrialBadge(productGroup)">{{trialBadgeText}}</span>
                        </span>
                    <product-group
                            :productGroup="productGroup"
                            :key="productGroup.tier"
                            :tabs-on-mobile="tabsOnMobile"
                            :id="`product-tier-${productGroup.tier}`"
                            :display-index="i"
                            :member="member"
                            class="tabPanel"
                            :class="{active: activetab === i}"/>
                </div>
            </div>
            <div id="tabs" class="tabset" v-if="productsLoaded && tabsOnMobile">
                <div class="tabs">
                    <template v-for="(productGroup, i) in productGroups">
                        <a class="tab-label" @click.prevent="activetab = i" v-bind:class="{active: activetab === i}"
                                aria-controls="basic">{{getGroupDisplayName(productGroup)}}<span class="trial-badge"
                                v-if="showTrialBadge(productGroup)">{{trialBadgeText}}</span>
                        </a>
                    </template>
                </div>

                <div class="tabPanels">
                    <template v-for="(productGroup, i) in productGroups">
                        <product-group
                                :productGroup="productGroup"
                                :key="productGroup.tier"
                                :id="`product-tier-${productGroup.tier}`"
                                :display-index="i"
                                :member="member"
                                class="tabPanel"
                                :tabs-on-mobile="tabsOnMobile"
                                :class="{active: activetab === i}"/>
                    </template>
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from '@shared/PageRoutes';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {getQueryParam} from "@web/util";
    import {QueryParam} from "@shared/util/queryParams";
    import Logger from "@shared/Logger";
    import CopyService from "@shared/copy/CopyService";
    import SubscriptionProductGroupCard from "@components/SubscriptionProductGroupCard.vue";
    import {SubscriptionProductGroupEntry} from "@shared/util/SubscriptionProductUtil";
    import SubscriptionProductGroupService from "@web/services/SubscriptionProductGroupService";

    const copy = CopyService.getSharedInstance().copy;
    const logger = new Logger("PremiumPricing");

    export default Vue.extend({
        components: {
            ProductGroup: SubscriptionProductGroupCard,
        },
        props: {
            tabsOnMobile: {type: Boolean, default: true}
        },
        data(): {
            isProcessing: boolean,
            member: CactusMember | undefined | null,
            memberEmail: string | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            premiumDefault: boolean,
            productGroups: SubscriptionProductGroupEntry[],
            productsLoaded: boolean,
            activetab: number,
        } {
            return {
                isProcessing: false,
                member: undefined,
                memberEmail: undefined,
                memberUnsubscriber: undefined,
                premiumDefault: false,
                activetab: 0,
                productsLoaded: false,
                productGroups: [],
            }
        },
        async beforeMount() {
            this.productGroups = await SubscriptionProductGroupService.sharedInstance.getSortedProductGroupEntries();
            this.productsLoaded = true;
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;

                    if (this.member?.email) {
                        this.memberEmail = this.member.email;
                    }
                }
            });

            const prem = getQueryParam(QueryParam.PREMIUM_DEFAULT);

            if (prem) {
                this.premiumDefault = true;
            }
        },
        beforeDestroy() {

        },
        computed: {
            trialBadgeText(): string | undefined {
                const member = this.member;
                if (!member) {
                    return undefined;
                }
                return `${member.daysLeftInTrial} ${copy.common.DAYS_LEFT}`
            }
        },
        methods: {
            goToSignup() {
                window.location.href = PageRoute.SIGNUP;
            },
            getGroupDisplayName(entry: SubscriptionProductGroupEntry): string | undefined {
                return entry.productGroup?.title ?? entry.tierDisplayName;
            },
            showTrialBadge(entry: SubscriptionProductGroupEntry): boolean {
                return this.member && this.member.isInTrial && this.member.tier === entry.tier || false
            },
        }

    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .centered {
        //overflow: hidden;
        position: relative;

        @include r(960) {
            display: flex;
            flex-direction: row-reverse;
            justify-content: center;
            text-align: left;
        }
    }

    .tabset {
        border-radius: 1.6rem;
        margin: 0 .8rem;
        text-align: left;

        @include r(374) {
            margin: 0 2.4rem;
        }
        @include r(600) {
            margin: 0 auto;
            max-width: 90%;
        }
        @include r(768) {
            background-color: transparent;
            min-width: 67rem;
        }
        @include r(960) {
            margin: 0;
        }
    }

    .tabs {
        display: flex;
    }

    .flex-plans {
        display: flex;

        flex-direction: column;
        @include r(768) {
            flex-direction: row;
        }

        .heading {
            display: flex;
            background-color: $dolphin;
            border-radius: 1.6rem 1.6rem 0 0;
        }

        .tabPanel {

        }

        .plan-container {
            margin-bottom: 2rem;
            @include shadowbox();

            &:first-child {
                .heading {
                    background-color: $white;
                    color: $darkestGreen;
                }
            }

            &:last-child {
                .heading {
                    background-color: $dolphin;
                    color: $white;
                }
            }

            &:not(:last-child) {
                margin-right: .5rem;
            }

            &:not(:first-child) {
                margin-left: .5rem;
            }
        }
    }

    .tab-label, .heading {
        background-color: darken($dolphin, 5%);
        color: $white;
        flex-basis: 50%;
        font-size: 2.4rem;
        font-weight: bold;
        padding: 1.6rem;
        text-align: center;

        @include r(768) {
            padding: 2.4rem 2.4rem .8rem;
            text-align: left;
        }

        .trial-badge {
            background-color: $darkestPink;
            color: white;
            padding: .4rem;
            border-radius: 2rem;
        }
    }

    .tab-label {

        &.active {
            background-color: $dolphin;
        }

        &:first-child {
            border-radius: 1.6rem 0 0 0;

            @include r(768) {
                background-color: $white;
                border-radius: 1.6rem 1.6rem 0 0;
                color: $darkestGreen;
            }
        }

        &:last-child {
            border-radius: 0 1.6rem 0 0;

            @include r(768) {
                background-color: $dolphin;
                border-radius: 1.6rem 1.6rem 0 0;
                color: $white;
            }
        }
    }

    .tabPanels {
        @include r(768) {
            display: flex;
        }

        .tabPanel {
            display: none;
            @include r(768) {
                display: block;
            }

            &.active {
                display: block;
            }
        }
    }

</style>
