<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn, loaded: authLoaded, sticky: isSticky}">
        <a :href="logoHref"><img v-bind:class="['nav-logo', {'large-desktop': largeLogoOnDesktop}]" src="/assets/images/logo.svg" alt="Cactus logo"/></a>
        <div>
            <transition name="fade-in-slow" appear>
                <a v-if="displayLoginButton"
                        class="login"
                        :href="loginHref"
                        @click.prevent="goToLogin"
                        type="link"
                >Log In</a>
            </transition>
            <transition name="fade-in-slow" appear>
                <a v-if="displaySignupButton"
                        data-test="signup-button"
                        class="jump-to-form button small"
                        @click.prevent="scrollToSignup"
                        type="button"
                >Sign Up</a>
            </transition>
        </div>
        <dropdown-menu :items="links" v-if="loggedIn">
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
    import {QueryParam} from '@shared/util/queryParams'

    declare interface NavBarData {
        authUnsubscribe: (() => void) | undefined,
        user: FirebaseUser | undefined | null,
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
            showLogin: {type: Boolean, default: true},
        },
        data(): NavBarData {
            return {
                user: undefined,
                authUnsubscribe: undefined,
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
                return this.showLogin && this.authLoaded && !this.user;
            },
            initials(): string {
                if (this.user) {
                    return getInitials(this.user.displayName || this.user.email || "")
                }
                return "";
            },
            loginHref(): string {
                return `${PageRoute.LOGIN}?${QueryParam.REDIRECT_URL}=${window.location.href}`;
            },
            logoHref(): string {
                return this.loggedIn ? PageRoute.JOURNAL_HOME : PageRoute.HOME;
            }
        },
        methods: {
            async logout(): Promise<void> {
                console.log('Logging out...');
                await logout({redirectUrl: this.signOutRedirectUrl || "/", redirectOnSignOut: this.redirectOnSignOut})
            },
            goToLogin() {
                window.location.href = this.loginHref;
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

    .login {
        font-size: 1.6rem;
        margin-left: .8rem;
        text-decoration: none;
        transition: background-color .2s ease-in-out;

        @include r(600) {
            font-size: 1.8rem;
            margin-left: 1.6rem;

            &:last-child {
                border: 1px solid $lightGreen;
                border-radius: 3rem;
                padding: 1rem 1.6rem;

                &:hover {
                    background-color: $lightGreen;
                }
            }
        }
    }

    a.button.jump-to-form {
        flex-grow: 0;
        margin-left: .8rem;

        @include r(600) {
            font-size: 1.8rem;
            margin-left: 1.6rem;
        }
    }

    header {

        &.loggedIn {
            display: flex;
            justify-content: space-between;
        }

        .nav-logo {
            display: block;
            height: 5.8rem;
            position: static;
            top: 0;
            width: 11.7rem;

            &.large-desktop {
                @include biggerThanPhone {
                    height: 8.8rem;
                    width: 17.8rem;
                }
            }

            @include isTinyPhone {
                height: 3.5rem;
                position: relative;
                top: 2px;
                width: 7rem;
            }
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

        @include isPhone {
            width: 3rem;
            height: 3rem;
        }

        &.open {
            transform: scale(.9);
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
        .navbar-avatar-container {
            width: 3rem;
            height: 3rem;
        }
    }


</style>
