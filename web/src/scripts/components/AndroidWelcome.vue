<template>
    <transition name="fade-in" appear>
        <div class="centered" v-if="!loading">
            <p>Your private journal for mindfulness.</p>
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
    @import "signup";

</style>
