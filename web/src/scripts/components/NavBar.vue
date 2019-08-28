<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn, loaded: authLoaded, sticky: isSticky}">
        <a href="/"><img v-bind:class="['nav-logo', {'large-desktop': largeLogoOnDesktop}]" src="/assets/images/logo.svg" alt="Cactus logo"/></a>
        <div>
            <transition name="fade-in-slow" appear>
                <a v-if="displayLoginButton"
                        class="link"
                        @click.prevent="goToLogin"
                        type="link"
                >Log In</a>
            </transition>
            <transition name="fade-in-slow" appear>
                <a v-if="displaySignupButton"
                        data-test="signup-button"
                        class="jump-to-form button"
                        @click.prevent="scrollToSignup"
                        type="button"
                >Sign Up Free</a>
            </transition>
        </div>
        <dropdown-menu :items="links">
            <div slot="custom-button">
                <div class="navbar-avatar-container">
                    <div v-if="!profileImageUrl" class="initials">{{initials}}</div>
                    <img v-if="profileImageUrl" :alt="(displayName || email) + `'s Profile Image`" :src="profileImageUrl"/>
                </div>
            </div>
        </dropdown-menu>
    </header>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FirebaseUser, getAuth} from '@web/firebase'
    import {getInitials} from '@shared/util/StringUtil'
    import {PageRoute} from '@web/PageRoutes'
    import {gtag} from "@web/analytics"
    import {clickOutsideDirective} from '@web/vueDirectives'
    import {logout} from '@web/auth'
    import DropdownMenu from "@components/DropdownMenu.vue"
    import {DropdownMenuLink} from "@components/DropdownMenuTypes"

    declare interface NavBarData {
        authUnsubscribe?: () => void,
        user?: FirebaseUser | undefined | null,
        menuOpen: boolean,
        authLoaded: boolean,
    }


    export default Vue.extend({
        directives: {
            'click-outside': clickOutsideDirective(),
        },
        components: {
            DropdownMenu,
        },
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
            isSticky: {type: Boolean, default: true},
            showLogin: {type: Boolean, default: false}, //NOTE: login is always disabled for now. See computed prop for displayLoginButton
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
            links(): DropdownMenuLink[] {
                const links: DropdownMenuLink[] = [{
                    title: "My Journal",
                    href: PageRoute.JOURNAL_HOME,
                }, {
                    title: "Invite Friends",
                    href: PageRoute.REFERRAL_PROGRAM,
                }, {
                    title: "Log Out",
                    onClick: async () => {
                        await this.logout()
                    }
                }];

                if (this.user && this.user.email) {
                    links.unshift({
                        static: true,
                        title: this.user.email,
                    })
                }

                return links;
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
                return show;
            },
            displayLoginButton(): boolean {
                const show = this.showLogin && this.authLoaded && !this.user;
                //NOTE: login button is always disabled for now.
                return false;
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
                await logout({redirectUrl: this.signOutRedirectUrl || "/", redirectOnSignOut: this.redirectOnSignOut})
            },
            goToLogin() {
                window.location.href = PageRoute.SIGNUP;
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
        button, a.button {
            flex-grow: 0;
            font-size: 1.6rem;
            margin: 0;
            padding: 1.2rem 2rem 1.6rem;
        }

        a.link {
            @include fancyLink;

            &:hover {
                cursor: pointer;
            }
        }

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
    }

    .dropdownMenuOpen {
        .navbar-avatar-container {
            transform: scale(.9);
        }
    }

    .navbar-avatar-container {
        cursor: pointer;
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        overflow: hidden;
        display: inline-block;
        transition: transform .2s ease-in-out;

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
        .navbar-avatar-container {
            width: 3rem;
            height: 3rem;
        }
    }
</style>
