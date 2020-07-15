<template>
    <footer v-bind:class="{lifted, transparent: isTransparent}" v-if="!isAndroidApp">
        <div class="centered">
            <div class="footerInfo">
                <router-link to="/">
                    <img class="logomark" src="/assets/images/logoMark.svg" alt=""/>
                </router-link>

                <div class="footerContent">
                    <p class="copyright">&copy; 2020 Cactus. All rights reserved.<br>
                        Have questions?&nbsp;&nbsp;<a class="contact" href="mailto:help@cactus.app">Send an
                            email.</a><br>
                        <router-link class="legal" to="/pricing">Pricing</router-link>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<router-link class="legal" to="/sponsor">
                            Sponsor
                        </router-link>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<router-link class="legal" to="/privacy-policy">
                            Privacy
                        </router-link>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<router-link class="legal" to="/terms-of-service">
                            Terms
                        </router-link>
                    </p>
                    <nav class="socialLinks">
                        <a class="link" rel="noreferrer" href="https://www.facebook.com/itscalledcactus" target="_blank"><img class="icon" src="/assets/images/facebook.svg" alt="facebook"/></a>
                        <a class="link" rel="noreferrer" href="https://twitter.com/itscalledcactus" target="_blank"><img class="icon" src="/assets/images/twitter.svg" alt="twitter"/></a>
                        <a class="link" rel="noreferrer" href="https://www.linkedin.com/company/19185975" target="_blank"><img class="icon" src="/assets/images/linkedin.svg" alt="linkedin"/></a>
                        <a class="link" rel="noreferrer" href="https://www.instagram.com/itscalledcactus/" target="_blank"><img class="icon" src="/assets/images/instagram.svg" alt="instagram"/></a>
                        <a class="link" rel="noreferrer" href="https://www.pinterest.com/itscalledcactus/" target="_blank"><img class="icon" src="/assets/images/pinterest.svg" alt="pinterest"/></a>
                        <a class="link" rel="noreferrer" href="https://itscalledcactus.tumblr.com/" target="_blank"><img class="icon" src="/assets/images/tumblr.svg" alt="tumblr"/></a>
                    </nav>
                </div>
            </div>
            <div class="app-icons" v-if="!isAndroidApp">
                <AppStoreIcon/>
                <PlayStoreIcon/>
            </div>
        </div>
    </footer>
</template>

<script lang="ts">
    import Vue from "vue"
    import AppStoreIcon from "@web/components/AppStoreIcon.vue";
    import PlayStoreIcon from "@web/components/PlayStoreIcon.vue";
    import { isAndroidApp } from '@web/DeviceUtil'
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";
    import { StandardFooterProps } from "@components/StandardFooterTypes";

    @Component({
        components: {
            AppStoreIcon,
            PlayStoreIcon
        }
    })
    export default class StandardFooter extends Vue implements StandardFooterProps {

        @Prop({ type: Boolean, required: false, default: false })
        lifted!: boolean;

        @Prop({ type: Boolean, default: false })
        isTransparent!: boolean;


        get isAndroidApp(): boolean {
            return isAndroidApp();
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    footer {
        background-color: $darkestGreen;
        color: white;
        font-size: 1.4rem;
        overflow-x: hidden;
        padding: 3.2rem 2.4rem 3.2rem;
        position: relative;
        z-index: 0;

        &.lifted {
            margin-top: -4.8rem;
            padding: 8rem 2.4rem 3.2rem;
        }

        &.transparent {
            background-color: transparent;
        }

        .centered {
            @include r(600) {
                display: flex;
                justify-content: space-between;
            }
            @include r(1200) {
                padding: 0 1.6rem;
            }
        }

        .contact, .legal {
            color: $white;
            text-decoration: underline;

            &:hover {
                color: $yellow;
                transition: color .3s ease-in-out;
            }
        }

        .app-icons {
            display: flex;
            justify-content: center;
        }
    }

    .footerInfo {
        align-items: center;
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        margin-bottom: 1.6rem;
        text-align: center;

        @include r(600) {
            align-items: flex-start;
            flex-flow: row nowrap;
            margin-bottom: 0;
            text-align: left;
        }

        .logomark {
            height: 4.4rem;
            margin: 0 .8rem .8rem 0;
            width: 2.4rem;

            @include r(600) {
                height: 5.6rem;
                margin: 0 1.6rem 0 0;
                width: 2.6rem;
            }
        }

        .copyright {
            margin: 0;
        }
    }

    .socialLinks {
        align-items: center;
        display: flex;
        justify-content: center;

        @include r(600) {
            justify-content: flex-end;
            margin-left: -.8rem;
        }

        .link {
            display: flex;
            opacity: .5;
            padding: .8rem;
            transition: opacity .3s ease-in-out;

            &:hover {
                opacity: 1;
            }
        }

        .icon {
            height: 2.4rem;
            width: 2.4rem;
        }
    }
</style>
