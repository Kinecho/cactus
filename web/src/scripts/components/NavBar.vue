<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn}">
        <a href="/"><img class="logo" src="../../assets/images/logo.svg" alt="Cactus logo"/></a>
        <a v-if="!loggedIn && showSignup" class="jump-to-form button" data-scroll-to="signupAnchor" data-focus-form="sign-up-top" type="button">Sign
            Up Free</a>
        <div v-if="loggedIn" class="user-info">
            <span>{{displayName}}</span>&nbsp;<a href="#" @click.prevent=logout>logout</a>
            <div class="avatar-container" v-if="profileImageUrl">
                <img :alt="(displayName || email) + `'s Profile Image`" :src="profileImageUrl"/>
            </div>

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
            signOutRedirectUrl: String,
            redirectOnSignOut: Boolean,
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
            },
            profileImageUrl(): string | undefined | null {
                return this.user ? this.user.photoURL : undefined;
            }
        },
        methods: {
            async logout(): Promise<void> {
                console.log('Logging out...')
                await getAuth().signOut();
                if (this.redirectOnSignOut) {
                    window.location.href = this.signOutRedirectUrl || '/';
                }

            },
        },
    })
</script>

<style lang="scss" scoped>
    @import "~styles/common";
    @import "~styles/mixins";

    header {
        &.loggedIn {
            display: flex;
            justify-content: space-between;

            @include isTinyPhone{
                .logo {
                    display: none;
                }
            }

        }

        .logo {
            @include isPhone {
                height: 3rem;
                width: 6rem;
            }
        }

        .user-info {
            display: flex;
            align-items: center;

            .avatar-container {
                width: 4rem;
                height: 4rem;
                border-radius: 50%;
                overflow: hidden;
                display: inline-block;
                margin: 0 1rem;
                img {
                    height: 100%;
                    width: 100%;

                }
            }

            @include isPhone{
                font-size: 1.4rem;
                .avatar-container {
                    width: 3rem;
                    height: 3rem;
                }
            }
        }


    }
</style>