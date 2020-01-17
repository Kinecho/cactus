<template lang="html">
    <div :class="['play-store-icon', {'only-mobile':onlyMobile}]" v-if="showToDevice()">
        <a @click.prevent="trackEvent(playStoreUrl); return false;" :href="playStoreUrl">
            <img class="googleBadge" src="/assets/google_play_store_badge.svg" alt="Get it on Google Play" />
        </a>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from "@web/config";
    import {PageRoute} from '@shared/PageRoutes'
    import {gtag} from "@web/analytics"
    import Logger from "@shared/Logger";
    const logger = new Logger("PlayStoreIcon.vue");

    export default Vue.extend({
        props: {
            onlyAndroid: {
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
            playStoreUrl: String | undefined,
            appUserAgent: String | undefined,
        } {
            return {
                playStoreUrl: Config.playStoreUrl,
                appUserAgent: Config.androidUserAgent
            }
        },
        beforeMount() {

        },
        methods: {
            showToDevice(): boolean {
                if (this.onlyAndroid && 
                    this.isAndroidDevice() && 
                    !this.isAndroidAppWebview()) {
                    return true;
                } else if (!this.onlyAndroid) {
                    return true;
                }
                return false;
            },
            isAndroidDevice(): boolean {
                const expression = new RegExp("android","i");
                logger.log('checking if android user agent ' + navigator.userAgent);
                logger.log(expression.test(navigator.userAgent))
                return expression.test(navigator.userAgent);
            },
            isAndroidAppWebview(): boolean {
                const expression = new RegExp(this.appUserAgent + "\/[0-9\.]+$");
                return expression.test(navigator.userAgent);
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

    .googleBadge {
        height: 5rem;
    }

    @include r(768) {
      .play-store-icon.only-mobile {
        display: none;
      }
    }

</style>
