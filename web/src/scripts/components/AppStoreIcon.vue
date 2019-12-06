<template lang="html">
    <div class="app-store-icon" v-if="showToDevice()">
        <a @click.prevent="trackEvent(appStoreUrl); return false;" :href="appStoreUrl">
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
                if (this.onlyiOS && this.isIosDevice()) {
                    return true;
                } else if (!this.onlyiOS) {
                    return true;
                } 
                return false;
            },
            isIosDevice(): boolean {
                return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            },
            trackEvent(url: string) {
                gtag('event', 'click', {
                    'event_category': "outbound",
                    'event_label': url,
                    'transport_type': 'beacon',
                    'event_callback': function() { 
                        // @ts-ignore
                        document.location = url; 
                    }
                });
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
