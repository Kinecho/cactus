<template>
    <div>
        <nav-bar v-if="showNav" v-bind="navProps" class="app-nav"/>
        <upgrade-success-banner v-if="showUpgradeSuccessBanner"
                @close="hasUpgradeSuccessParam = false"/>
        <transition name="component-fade" appear mode="out-in">
            <router-view v-if="allLoaded && showRoute" v-bind="props"/>
            <div v-else-if="showUnauthorizedRoute">
                <h2>Please log in to continue</h2>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import CactusMemberService from "@web/services/CactusMemberService";
    import AppSettingsService from "@web/services/AppSettingsService";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import CactusMember from "@shared/models/CactusMember";
    import Logger from "@shared/Logger"
    import NavBar from "@components/NavBar.vue";
    import {
        doPassMember,
        doPassSettings,
        doPassUser,
        doShowNavBar,
        isAuthRequired,
        MetaRouteConfig,
    } from "@web/router-meta";
    import { NavBarProps } from "@components/NavBarTypes";
    import { isBoolean } from "@shared/util/ObjectUtil";
    import { Route } from "vue-router";
    import { Watch } from "vue-property-decorator";
    import UpgradeSuccessBanner from "@components/upgrade/UpgradeSuccessBanner.vue";
    import { getQueryParam, removeQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import StorageService, { LocalStorageKey } from "@web/services/StorageService";
    import { fireOptInStartTrialEvent } from "@web/analytics";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import AppSettings from "@shared/models/AppSettings";
    import { FirebaseUser } from "@web/firebase";

    const logger = new Logger("App");

    @Component({
        components: {
            UpgradeSuccessBanner,
            NavBar
        }
    })
    export default class App extends Vue {
        name = "App"
        settings: AppSettings | null = null;
        settingsUnsubscriber!: ListenerUnsubscriber;
        authLoaded = false;
        settingsLoaded = false;
        member: CactusMember | null = null;
        user: FirebaseUser | null = null;
        memberListener!: ListenerUnsubscriber;
        showUnauthorizedRoute = false;
        hasUpgradeSuccessParam = false;

        @Watch("$route")
        onRoute(route: Route) {
            this.showUnauthorizedRoute = isAuthRequired(route) && !this.member && this.authLoaded;

            if (getQueryParam(QueryParam.UPGRADE_SUCCESS) === 'success') {
                this.hasUpgradeSuccessParam = true;
                removeQueryParam(QueryParam.UPGRADE_SUCCESS)
                logger.info("Firing upgrade confirmed event");
                let priceDollars = StorageService.getNumber(LocalStorageKey.subscriptionPriceCents);

                if (priceDollars) {
                    priceDollars = priceDollars / 100;
                }

                fireOptInStartTrialEvent({ value: priceDollars });
            } else {
                this.hasUpgradeSuccessParam = false;
            }
            // updateRouteMeta(route)
        }

        @Watch("showUpgradeBanner")
        onUpgradeConfirmed(current: boolean, previous: boolean) {

            // if (current && !previous) {
            //     logger.info("Firing upgrade confirmed event");
            //     let priceDollars = StorageService.getNumber(LocalStorageKey.subscriptionPriceCents);
            //
            //     if (priceDollars) {
            //         priceDollars = priceDollars / 100;
            //     }
            //
            //     fireOptInStartTrialEvent({ value: priceDollars });
            // }
        }

        get showUpgradeSuccessBanner(): boolean {
            return this.authLoaded && !!this.member && this.hasUpgradeSuccessParam && isPremiumTier(this.member?.tier)
        }

        async beforeMount() {
            // this.onRoute(this.$route)
            this.settingsUnsubscriber = AppSettingsService.sharedInstance.observeAppSettings({
                onData: (settings) => {
                    this.settings = settings ?? null;
                    this.settingsLoaded = true;
                }
            });

            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({ member, user }) => {
                    this.member = member ?? null;
                    this.user = user ?? null;
                    this.authLoaded = true;
                }
            })
        }

        get props(): Record<string, any> {
            const props: Record<string, any> = {}
            if (doPassMember(this.$route)) {
                props.member = this.member;
            }
            if (doPassUser(this.$route)) {
                props.user = this.user;
            }

            if (doPassSettings(this.$route)) {
                props.settings = this.settings
            }

            return props
        }

        get showNav(): boolean {
            return doShowNavBar(this.$route);
        }

        get navProps(): Partial<NavBarProps | null> {
            const props = (this.$route as MetaRouteConfig).meta?.navBar ?? null;
            if (isBoolean(props)) {
                return null;
            }
            return props;
        }

        get showRoute(): boolean {
            return this.$route.meta.authRequired ? !!this.member : true
        }

        get allLoaded(): boolean {
            return this.settingsLoaded && this.authLoaded
        }
    }
</script>

<style lang="scss">
    @import "common";
    @import "transitions";

    .app-nav {
        z-index: 1001;
    }
</style>
