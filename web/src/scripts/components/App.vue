<template>
    <transition name="component-fade" appear mode="out-in">
        <router-view v-if="allLoaded"/>
    </transition>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import CactusMemberService from "@web/services/CactusMemberService";
    import AppSettingsService from "@web/services/AppSettingsService";

    @Component
    export default class App extends Vue {

        settingsLoaded = false;
        authLoaded = false;

        async beforeMount() {
            await Promise.all([CactusMemberService.sharedInstance.getCurrentMember(),
                AppSettingsService.sharedInstance.getCurrentSettings()]);
            this.authLoaded = true;
            this.settingsLoaded = true;
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
