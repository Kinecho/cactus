<template>
    <div class="centered">
        <transition appear name="fade-in">
            <div id="tabs" class="tabset" v-if="productsLoaded">
                <div class="tabs">
                    <template v-for="(productGroup, i) in productGroups">
                        <a class="tab-label" @click.prevent="activetab = i" v-bind:class="{active: activetab === i}" aria-controls="basic">{{getGroupDisplayName(productGroup)}}</a>
                    </template>
                </div>

                <div class="tabPanels">
                    <template v-for="(productGroup, i) in productGroups">
                        <product-group
                                :productGroup="productGroup"
                                :key="productGroup.tier"
                                :id="`product-tier-${productGroup.tier}`"
                                :display-index="i"
                                class="tabContent"
                                :member="member"
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
        props: {},
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
        computed: {},
        methods: {
            goToSignup() {
                window.location.href = PageRoute.SIGNUP;
            },
            getGroupDisplayName(entry: SubscriptionProductGroupEntry): string | undefined {
                return entry.productGroup?.title ?? entry.tierDisplayName;
            }
        }

    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .centered {
        overflow: hidden;
        position: relative;

        @include r(960) {
            display: flex;
            flex-direction: row-reverse;
            justify-content: center;
            text-align: left;
        }
    }

    .tabset {
        border-radius: 1.2rem;
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

        .tab-label {
            background-color: darken($dolphin, 5%);
            color: $white;
            flex-basis: 50%;
            font-size: 2rem;
            font-weight: bold;
            padding: 1.6rem;
            text-align: center;

            @include r(768) {
                text-align: left;
            }

            &.active {
                background-color: $dolphin;
            }

            &:first-child {
                border-radius: 1.2rem 0 0 0;

                @include r(768) {
                    background-color: $white;
                    border-radius: 1.2rem 1.2rem 0 0;
                    color: $darkestGreen;
                }
            }

            &:last-child {
                border-radius: 0 1.2rem 0 0;

                @include r(768) {
                    background-color: $dolphin;
                    border-radius: 1.2rem 1.2rem 0 0;
                    color: $white;
                }
            }
        }
    }

    .tabPanels {
        @include r(768) {
            display: flex;
        }
    }

    .heart:before {
        background-image: url(assets/icons/heart.svg);
        height: 1.5rem;
    }

</style>
