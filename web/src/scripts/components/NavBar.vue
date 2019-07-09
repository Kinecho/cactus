<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn}">
        <a href="/"><img class="logo" src="../../assets/images/logo.svg" alt="Cactus logo"/></a>
        <a v-if="!loggedIn && showSignup" class="jump-to-form button" data-scroll-to="signupAnchor" data-focus-form="sign-up-top" type="button">Sign
            Up Free</a>
        <div v-if="loggedIn">
            <span>{{displayName}}</span>&nbsp;<a href="#" @click.prevent=logout>logout</a>
        </div>

    </header>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FirebaseUser, getAuth} from '@web/firebase'

    declare interface NavBarData {
        authUnsubscribe?: () => void,
        user?: FirebaseUser | undefined | null,
    }

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(user => {
                this.user = user;
            })
        },
        beforeDestroy() {
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
            }
        },
        props: {
            showSignup: Boolean,
        },
        data(): NavBarData {
            return {
                user: null,
                authUnsubscribe: undefined,
            }
        },
        computed: {
            loggedIn(): boolean {
                return !!this.user;
            },
            displayName(): string | undefined | null {
                return this.user ? this.user.displayName || this.user.email : null;
            },
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            }
        },
        methods: {
            async logout(): Promise<void> {
                console.log('Logging out...')
                await getAuth().signOut();
                window.location.href = '/'
            },
        },
    })
</script>

<style lang="scss" scoped>
    header {
        &.loggedIn {
            display: flex;
            justify-content: space-between;
        }

    }
</style>