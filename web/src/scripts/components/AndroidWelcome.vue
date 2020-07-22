<template>
    <transition name="fade-in" appear>
        <div class="welcome-wrapper" v-if="!loading">
            <NavBar v-bind:showSignup="false"
                    :showLogin="false"
                    v-bind:redirectOnSignOut="false"
                    :isSticky="false"
                    :forceTransparent="true"
                    :largeLogoOnDesktop="true"
                    :whiteLogo="true"/>
            <div class="flexContainer">
                <p class="subtext">Your private journal for&nbsp;mindfulness.</p>
                <router-link :to="continuePath" class="btn button primary">Continue</router-link>
            </div>
        </div>
    </transition>
</template>

<script lang="ts">
    import Vue from "vue";
    import { PageRoute } from "@shared/PageRoutes";
    import { getAuth, Unsubscribe } from "@web/firebase";
    import NavBar from "@components/NavBar.vue";
    import { pushRoute } from "@web/NavigationUtil";
    import Logger from "@shared/Logger"
    import { QueryParam } from "@shared/util/queryParams";

    const logger = new Logger("AndroidWelcome");


    export default Vue.extend({
        components: {
            NavBar,
        },
        beforeMount(): void {
            document.body.classList.add("sign-up-body");
            this.authListener = getAuth().onAuthStateChanged(async (user) => {
                if (user) {
                    logger.info("Welcome page, user is logged in, sending them home");
                    // await pushRoute(PageRoute.JOURNAL_HOME);
                    window.location.href = PageRoute.MEMBER_HOME;
                }
                this.authLoaded = true;
            })
        },
        mounted(): void {
            document.body.classList.add("sign-up-body");
        },
        beforeDestroy(): void {
            this.authListener?.();
            document.body.classList.remove("sign-up-body");
        },
        data(): {
            authLoaded: boolean,
            continuePath: PageRoute|string,
            authListener: Unsubscribe | undefined,
        } {
            return {
                authLoaded: false,
                continuePath: `${ PageRoute.GET_STARTED }?${ QueryParam.REDIRECT_URL }=${ PageRoute.HELLO_ONBOARDING }`,
                authListener: undefined,
            }
        },
        computed: {
            loading(): boolean {
                return !this.authLoaded
            }
        }
    })
</script>

<style lang="scss">
    @import "mixins";

    body.sign-up-body {
        @include blueWavyBackground;
    }
</style>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .welcome-wrapper {
        align-items: center;
        color: $white;
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        min-height: 100vh;
    }

    header {
        margin-bottom: 1.6rem;
        margin-top: 16vh;

        @include h(600) {
            margin-top: 30vh;
        }
    }


    .flexContainer {
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-between;
        min-height: 58vh;

        @include r(600) {
            justify-content: flex-start;
        }
    }

    .subtext {
        margin: 0 auto 2.4rem;
        max-width: 24rem;
        text-align: center;

        @include r(600) {
            margin-bottom: 4.8rem;
            max-width: none;
        }
    }

    a.button {
        bottom: 2.4rem;
        display: block;
        flex-grow: 0;
        position: sticky;
        text-align: center;

        @include r(600) {
            position: static;
        }
    }

</style>
