<template>
    <transition name="fade-in" appear>
        <div class="flexContainer" v-if="!loading">
            <p class="subtext">Your private journal for&nbsp;mindfulness.</p>
            <a :href="continuePath" class="btn button primary">Continue</a>
        </div>
    </transition>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@shared/PageRoutes";
    import {getAuth, Unsubscribe} from "@web/firebase";

    export default Vue.extend({
        created() {

        },
        props: {},
        beforeMount(): void {
            // this.memberUnsubscriber = CactusMemberService.sharedInstance.authS
            this.authListener = getAuth().onAuthStateChanged(user => {
                if (user) {
                    window.location.href = PageRoute.JOURNAL_HOME
                }
                this.authLoaded = true;
            })
        },
        destroyed(): void {
            this.authListener?.();
        },
        data(): {
            authLoaded: boolean,
            continuePath: PageRoute,
            authListener: Unsubscribe | undefined,
            logoHref: string,
        } {
            return {
                authLoaded: false,
                continuePath: PageRoute.SIGNUP,
                logoHref: PageRoute.HOME,
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

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

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
