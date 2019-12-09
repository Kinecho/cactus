<template>
    <footer>
        <div class="centered">
            <div class="footerInfo">
                <img class="logomark" src="/assets/images/logoMark.svg" alt=""/>
                <div class="footerContent">
                    <p class="copyright">&copy; 2019 Cactus. All rights reserved.<br>
                        Have questions?&nbsp;&nbsp;<a class="contact" href="mailto:help@cactus.app">Send an
                            email.</a><br>
                        <a class="legal" href="/privacy-policy">Privacy</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a class="legal" href="/terms-of-service">Terms</a>
                    </p>
                    <nav class="socialLinks">
                        <a class="link" href="https://www.facebook.com/itscalledcactus" target="_blank"><img class="icon" src="/assets/images/facebook.svg" alt="facebook"/></a>
                        <a class="link" href="https://twitter.com/itscalledcactus" target="_blank"><img class="icon" src="/assets/images/twitter.svg" alt="twitter"/></a>
                        <a class="link" href="https://www.linkedin.com/company/19185975" target="_blank"><img class="icon" src="/assets/images/linkedin.svg" alt="linkedin"/></a>
                        <a class="link" href="https://www.instagram.com/itscalledcactus/" target="_blank"><img class="icon" src="/assets/images/instagram.svg" alt="instagram"/></a>
                        <a class="link" href="https://www.pinterest.com/itscalledcactus/" target="_blank"><img class="icon" src="/assets/images/pinterest.svg" alt="pinterest"/></a>
                        <a class="link" href="https://itscalledcactus.tumblr.com/" target="_blank"><img class="icon" src="/assets/images/tumblr.svg" alt="tumblr"/></a>
                    </nav>
                </div>
            </div>
            <AppStoreIcon/>
        </div>
    </footer>
</template>

<script lang="ts">
    import Vue from "vue"
    import AppStoreIcon from "@web/components/AppStoreIcon.vue";

    export default Vue.extend({
        components: {
            AppStoreIcon
        }
    })

</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    footer {
        background-color: $darkestGreen;
        color: white;
        font-size: 1.4rem;
        padding: 3.2rem 2.4rem 3.2rem;
        position: relative;
        z-index: 0;
        overflow-x: hidden;

        &.lifted {
            margin-top: -4.8rem;
            padding: 8rem 2.4rem 3.2rem;
        }

        .app-store-icon {
            display: block;
            margin-top: 2rem;

            @include r(600) {
                display: inline-block;
                margin-left: 1rem;
                margin-top: 0;
            }
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
    }

    .footerInfo {
        align-items: center;
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        margin-bottom: 1.6rem;

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