<template lang="html">
    <div :class="['app-store-icon', {'only-mobile':onlyMobile}]" v-if="showToDevice()">
        <a @click.prevent="trackEvent(appStoreUrl); return false;" :href="appStoreUrl">
            <img class="appStoreBadge" src="/assets/apple_app_store_badge.svg" alt="Download on the App Store" />
        </a>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from "@web/config";
    import {isIosDevice} from '@web/DeviceUtil'
    import {gtag} from "@web/analytics"

    export default Vue.extend({
        props: {
            onlyiOS: {
                type: Boolean,
                default: false
            },
            onlyMobile: {
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
                if (this.onlyiOS && isIosDevice()) {
                    return true;
                } else if (!this.onlyiOS) {
                    return true;
                }
                return false;
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

    @include r(768) {
      .app-store-icon.only-mobile {
        display: none;
      }
    }

</style>
