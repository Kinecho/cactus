<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn}">
        <a href="/"><img v-bind:class="['nav-logo', {'large-desktop': largeLogoOnDesktop}]" src="/assets/images/logo.svg" alt="Cactus logo"/></a>
        <a v-if="displaySignupButton"
                class="jump-to-form button"
                @click.prevent="scrollToSignup"
                type="button"
        >Sign Up Free</a>

        <transition name="fade-in">
            <div v-if="loggedIn" class="user-info">
                <div v-click-outside="closeMenu">
                    <div class="avatar-container" @click="toggleMenu" v-bind:class="{open: menuOpen}">
                        <div v-if="!profileImageUrl" class="initials">{{initials}}</div>
                        <img v-if="profileImageUrl" :alt="(displayName || email) + `'s Profile Image`" :src="profileImageUrl"/>
                    </div>
                    <transition name="fade-down">
                        <nav class="moreMenu" v-show="menuOpen">
                            <template v-for="(link) in links" v-bind:link="link">
                                <a v-if="link.href" :href="link.href">{{link.title}}</a>
                                <span v-if="link.onClick" @click.prevent="link.onClick">{{link.title}}</span>
                            </template>
                            <!--                        <a :href="PageRoute.JOURNAL_HOME">My Journal</a>-->
                            <!--                        <a href="#" @click.prevent=logout>logout</a>-->
                        </nav>
                    </transition>
                </div>
            </div>
        </transition>
    </header>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FirebaseUser, getAuth} from '@web/firebase'
    import {getInitials} from '@shared/util/StringUtil'
    import {PageRoute} from '@web/PageRoutes'
    import {gtag} from "@web/analytics"

    declare interface LinkData {
        title: string,
        href?: string,
        onClick?: () => Promise<void> | void
    }

    declare interface NavBarData {
        authUnsubscribe?: () => void,
        user?: FirebaseUser | undefined | null,
        menuOpen: boolean,
        authLoaded: boolean,
    }

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(user => {
                this.user = user;
                this.authLoaded = true;
            })
        },
        destroyed() {
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
            }
        },
        props: {
            showSignup: {type: Boolean, default: false},
            signOutRedirectUrl: String,
            redirectOnSignOut: Boolean,
            signupFormAnchorId: {type: String, default: "signupAnchor"},
            largeLogoOnDesktop: Boolean,
        },
        data(): NavBarData {
            return {
                user: null,
                authUnsubscribe: undefined,
                menuOpen: false,
                authLoaded: false,
            }
        },
        computed: {
            loggedIn(): boolean {
                return !!this.user;
            },
            links(): LinkData[] {
                return [{
                    title: "My Journal",
                    href: PageRoute.JOURNAL_HOME,
                }, {
                    title: "Log Out",
                    onClick: async () => {
                        await this.logout()
                    }
                }]
            },
            displayName(): string | undefined | null {
                return this.user ? this.user.displayName || this.user.email : null;
            },
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            },
            profileImageUrl(): string | undefined | null {
                return this.user ? this.user.photoURL : undefined;
            },
            displaySignupButton(): boolean {
                const show = this.showSignup && this.authLoaded && !this.user;
                console.log("show signup button", show);
                return show;
            },
            initials(): string {
                if (this.user) {
                    return getInitials(this.user.displayName || this.user.email || "")
                }
                return "";
            }
        },
        methods: {
            async logout(): Promise<void> {
                console.log('Logging out...');
                await getAuth().signOut();
                if (this.redirectOnSignOut) {
                    window.location.href = this.signOutRedirectUrl || '/';
                }

            },
            toggleMenu() {
                this.menuOpen = !this.menuOpen;
            },
            closeMenu() {
                this.menuOpen = false;
            },
            scrollToSignup() {
                if (!this.signupFormAnchorId) {
                    return;
                }

                const scrollToId = this.signupFormAnchorId;

                const content = document.getElementById(scrollToId);
                gtag("event", "scroll_to", {formId: this.signupFormAnchorId});
                if (content) content.scrollIntoView();
            }
        },
    })
</script>

<style lang="scss" scoped>
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";

    header {
        &.out {
            opacity: 0;
        }

        &.loggedIn {
            display: flex;
            justify-content: space-between;
        }

        .nav-logo {
            height: 5.8rem;
            width: 11.7rem;

            &.large-desktop {
                @include biggerThanPhone {
                    height: 8.8rem;
                    width: 17.8rem;
                }
            }

            @include isTinyPhone {
                height: 4rem;
                width: 7rem;
            }
        }


        .user-info {
            display: flex;
            align-items: center;
            position: relative;

            .moreMenu {
                background-color: $lightPink;
                border-radius: 6px;
                right: 1rem;
                padding: .8rem 0;
                position: absolute;
                top: 4rem;
                z-index: 100;

                a, span {
                    background-color: transparent;
                    color: $darkestPink;
                    display: block;
                    font-size: 1.6rem;
                    opacity: .8;
                    padding: .8rem 2.4rem;
                    text-decoration: none;
                    transition: opacity .2s ease-in-out, background-color .2s ease-in-out;
                    white-space: nowrap;

                    &:hover {
                        background-color: lighten($lightPink, 2%);
                        opacity: 1;
                        cursor: pointer;
                    }
                }
            }

            .avatar-container {
                width: 4rem;
                height: 4rem;
                border-radius: 50%;
                overflow: hidden;
                display: inline-block;
                margin: 0 1rem;

                &.open {
                    filter: grayscale(50%);
                    box-shadow: rgba(122, 56, 20, 0.18) 0 11px 28px -8px;
                }

                :hover {
                    cursor: pointer;
                    filter: grayscale(50%);
                }

                .initials {
                    background: $darkGreen;
                    color: white;
                    height: 100%;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                img {
                    height: 100%;
                    width: 100%;

                }
            }

            @include isPhone {
                font-size: 1.4rem;
                .avatar-container {
                    width: 3rem;
                    height: 3rem;
                }
            }
        }


    }
</style>