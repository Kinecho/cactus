<template>
    <div class="wrapper">
        <div class="centered">
            <transition appear name="fade-in">
                <div class="flex-plans" v-if="loaded && !tabsOnMobile">
                    <div v-for="(productGroup, i) in groupEntries" class="plan-container">
                        <div :class="[productGroup.tier.toLowerCase(), 'heading']">
                            {{getGroupDisplayName(productGroup)}}<span v-if="showTrialBadge(productGroup)">&nbsp;Trial</span>
                            <span class="trial-badge" v-if="showTrialBadge(productGroup)">{{trialBadgeText}}</span>
                        </div>
                        <product-group
                                :productGroup="productGroup"
                                :key="productGroup.tier"
                                :tabs-on-mobile="tabsOnMobile"
                                :id="`product-tier-${productGroup.tier}`"
                                :display-index="i"
                                :member="member"
                                :class="[`tabPanel`, {active: activetab === i}]"
                                :learnMoreLinks="learnMoreLinks"/>
                    </div>

                </div>
                <div id="tabs" class="tabset" v-if="loaded && tabsOnMobile">
                    <div class="tabs">
                        <template v-for="(productGroup, i) in groupEntries">
                            <a class="tab-label"
                                    @click.prevent="activetab = i"
                                    v-bind:class="{active: activetab === i}"
                                    aria-controls="basic">
                                {{getGroupDisplayName(productGroup)}}<span v-if="showTrialBadge(productGroup)">&nbsp;Trial</span>
                                <span class="trial-badge" v-if="showTrialBadge(productGroup)">{{trialBadgeText}}</span>
                            </a>
                        </template>
                    </div>

                    <div class="tabPanels">
                        <template v-for="(productGroup, i) in groupEntries">
                            <product-group
                                    :productGroup="productGroup"
                                    :key="productGroup.tier"
                                    :id="`product-tier-${productGroup.tier}`"
                                    :display-index="i"
                                    :member="member"
                                    class="tabPanel"
                                    :tabs-on-mobile="tabsOnMobile"
                                    :learnMoreLinks="learnMoreLinks"
                                    :is-restoring-purchases="isRestoringPurchases"
                                    :class="{active: activetab === i}"/>
                        </template>

                    </div>
                </div>
            </transition>
        </div>
        <div class="restore-container" :class="{noTabs: !tabsOnMobile}" v-if="isAndroidApp">
            <a class="fancyLink" @click.prevent="restorePurchases" :disabled="isRestoringPurchases">Restore
                Purchases
            </a>
        </div>
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
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import {isAndroidApp} from "@web/DeviceUtil";
    import AndroidService from "@web/android/AndroidService";
    import {restoreAndroidPurchases} from "@web/checkoutService";

    const copy = CopyService.getSharedInstance().copy;
    const logger = new Logger("PremiumPricing");

    export default Vue.extend({
        components: {
            ProductGroup: SubscriptionProductGroupCard,
        },
        props: {
            tabsOnMobile: {type: Boolean, default: true},
            learnMoreLinks: {type: Boolean, default: false},
        },
        data(): {
            isProcessing: boolean,
            isRestoringPurchases: boolean,
            memberLoaded: boolean,
            member: CactusMember | undefined | null,
            memberEmail: string | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            premiumDefault: boolean,
            productGroups: SubscriptionProductGroupEntry[],
            productsLoaded: boolean,
            activetab: number,
        } {
            return {
                memberLoaded: false,
                isProcessing: false,
                isRestoringPurchases: false,
                member: undefined,
                memberEmail: undefined,
                memberUnsubscriber: undefined,
                premiumDefault: false,
                activetab: 1,
                productsLoaded: false,
                productGroups: [],
            }
        },
        mounted(): void {
            const fromAuth = getQueryParam(QueryParam.FROM_AUTH);
            // const fromAuthStorage = StorageService.getJSON(LocalStorageKey.landingQueryParams)[QueryParam.FROM_AUTH];
            if (isAndroidApp() && fromAuth) {
                AndroidService.shared.showToast("You are now signed in");
                logger.info("Showing toast for signed in ");
            } else {
                logger.info("Not showing toast");
            }
        },
        async beforeMount() {

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.memberLoaded = true;
                    if (this.member?.email) {
                        this.memberEmail = this.member.email;
                    }
                }
            });

            this.productGroups = await SubscriptionProductGroupService.sharedInstance.getSortedProductGroupEntries();
            this.productsLoaded = true;

            const prem = getQueryParam(QueryParam.PREMIUM_DEFAULT);

            if (prem) {
                this.premiumDefault = true;
            }
        },
        beforeDestroy() {

        },
        computed: {
            loaded(): boolean {
                return this.memberLoaded && this.productsLoaded
            },
            groupEntries(): SubscriptionProductGroupEntry[] {
                return this.productGroups.filter(e => {
                    if (!this.member) {
                        return true
                    }
                    return !((this.member?.isOptInTrialing ?? false) && e.tier === SubscriptionTier.BASIC)
                })
            },
            trialBadgeText(): string | undefined {
                const member = this.member;
                if (!member) {
                    return undefined;
                }
                return CopyService.getSharedInstance().getTrialDaysLeftShort(member.daysLeftInTrial, true);
            },
            isAndroidApp(): boolean {
                return isAndroidApp();
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
                return this.member && this.member.isOptInTrialing && this.member.tier === entry.tier || false
            },
            async restorePurchases() {
                try {
                    if (!isAndroidApp()) {
                        alert("Restore Purchases can only be done on an android device.");
                        return;
                    }
                    this.isRestoringPurchases = true;
                    const result = await restoreAndroidPurchases({member: this.member ?? undefined});
                    if (result.success) {
                        AndroidService.shared.showToast("Finished restoring purchases");
                    }
                } catch (error) {
                    logger.error("Failed to init restore purchases flow", error);
                } finally {
                    this.isRestoringPurchases = false
                }
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
        position: relative;

        @include r(960) {
            display: flex;
            flex-direction: row-reverse;
            justify-content: center;
            text-align: left;
        }
    }

    .tabset {
        margin: 0 auto;
        max-width: 48rem;

        @include r(768) {
            max-width: none;
            min-width: 80rem;
        }
    }

    .tabs {
        display: flex;
        justify-content: center;
        position: relative;
        z-index: 1;
    }

    .heading {
        border-radius: 1.6rem 1.6rem 0 0;
        font-size: 2.4rem;
        font-weight: bold;
        padding: 2.4rem 1.6rem .8rem;
        position: relative;
        text-align: left;
        z-index: 1;

        @include r(374) {
            padding: 2.4rem 2.4rem .8rem;
        }

        &.basic {
            background-color: $white;
            color: $darkestGreen;
        }

        &.plus {
            background: $dolphin url(assets/images/grainy.png) repeat;
            color: $white;
        }
    }

    .flex-plans {
        display: flex;
        flex-direction: column;
        margin: 0 -1.6rem;

        @include r(374) {
            margin: 0;
        }
        @include r(768) {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
        }

        .plan-container {
            max-width: 40rem;

            @include r(768) {
                display: flex;
                flex-basis: 49%;
                flex-direction: column;
            }

            .tab-content {
                display: block;
                margin: 0 0 2.4rem;
                padding: 0 1.6rem 2.4rem;

                @include r(374) {
                    padding: 0 2.4rem 2.4rem;
                }
                @include r(768) {
                    flex-grow: 1;
                    margin-bottom: 0;
                    padding: 1.6rem 2.4rem 2.4rem;
                }

                &.basic-panel {
                    background-image: none;
                }
            }
        }

        .basic-panel button:disabled {
            color: transparentize($darkestGreen, .4);
        }
    }

    .tab-label {
        background-color: darken($dolphin, 5%);
        color: $white;
        flex-basis: 50%;
        font-size: 2.4rem;
        font-weight: bold;
        padding: 1.6rem 2.4rem;
        text-align: center;

        @include r(768) {
            margin: 0 1.6rem;
            padding: 2.4rem 2.4rem .8rem;
            text-align: left;
        }

        &.active {
            background: $dolphin url(assets/images/grainy.png) repeat;

            @include r(768) {
                background-image: none;
            }
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
                background: $dolphin url(assets/images/grainy.png) repeat;
                border-radius: 1.6rem 1.6rem 0 0;
                color: $white;
            }
        }

        &:only-child {
            background: $dolphin url(assets/images/grainy.png) repeat;
            border-radius: 1.6rem 1.6rem 0 0;
            flex-basis: 100%;
            padding-left: 1.6rem;
            padding-bottom: .8rem;
            text-align: left;

            @include r(374) {
                padding-left: 2.4rem;
            }
            @include r(768) {
                flex-basis: 50%;
            }
        }
    }

    .restore-container {
        padding: 3rem 0;
        &.noTabs {
            margin-left: 1rem;
        }
    }

    .trial-badge {
        @include trialBadge;
        vertical-align: text-top;
    }

    .tabPanels {
        justify-content: center;

        @include r(768) {
            display: flex;
        }
    }

    .tabPanel {
        display: none;

        &:only-child {
            display: block;
            padding-top: .8rem;
        }

        @include r(768) {
            display: block;
        }

        &.active {
            display: block;
        }
    }

    .android-app {
        font-size: 2rem;
    }

</style>
