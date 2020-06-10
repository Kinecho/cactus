<template>
    <transition name="component-fade" appear mode="out-in">
        <router-view v-if="allLoaded && showRoute" v-bind="props"/>
        <div v-else-if="showUnauthorizedRoute">
            <h2>Please log in to continue</h2>
        </div>
    </transition>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import CactusMemberService from "@web/services/CactusMemberService";
    import AppSettingsService from "@web/services/AppSettingsService";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import CactusMember from "@shared/models/CactusMember";
    import Logger from "@shared/Logger"

    const logger = new Logger("App");

    @Component
    export default class App extends Vue {
        settingsLoaded = false;
        authLoaded = false;
        member: CactusMember | null = null;
        memberListener!: ListenerUnsubscriber

        async beforeMount() {
            await Promise.all([AppSettingsService.sharedInstance.getCurrentSettings()]);
            this.settingsLoaded = true;
            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({ member }) => {
                    this.member = member ?? null;
                    this.authLoaded = true;
                }
            })
        }

        get props(): any {
            if (this.$route.meta.passMember) {

            }
            return { member: this.member }
        }

        get showRoute(): boolean {
            return this.$route.meta.authRequired ? !!this.member : true
        }

        get showUnauthorizedRoute() {
            return this.$route.meta.authRequired && !this.member && this.authLoaded;
        }

        get allLoaded(): boolean {
            return this.settingsLoaded && this.authLoaded
        }
    }
</script>

<style lang="scss">
    @import "common";
    @import "transitions";
</style>
