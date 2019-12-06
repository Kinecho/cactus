<template lang="html">
    <div class="app-store-icon" v-if="showToDevice()">
        <a :href="appStoreUrl">
            <img src="/assets/apple_app_store_badge.svg" />
        </a>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from "@web/config";
    import {PageRoute} from '@shared/PageRoutes'
    import {gtag} from "@web/analytics"

    export default Vue.extend({
        props: {
            onlyiOS: {
                type: Boolean,
                default: false
            }
        },
        data(): 
        {
            appStoreUrl: String | undefined,
        } {
            return {
                appStoreUrl: Config.appStoreUrl
            }
        },
        methods: {
            showToDevice(): boolean {
                console.log(this.onlyiOS);
                if (this.onlyiOS && this.isIosDevice()) {
                    return true;
                } else if (!this.onlyiOS) {
                    return true;
                } 
                return false;
            },
            isIosDevice(): boolean {
                console.log('called isios');
                return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            }
        }
    })
</script>

<style lang="scss" >
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";

    a { 
        text-align: left;
    }
</style>
