<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn, loaded: authLoaded, sticky: isSticky, transparent: forceTransparent}" v-if="!hidden">
        <div class="centered">
            <a :href="logoHref"><img v-bind:class="['nav-logo', {'large-desktop': largeLogoOnDesktop}]" src="/assets/images/logo.svg" alt="Cactus logo"/></a>
            <div v-if="displayLoginButton || displaySignupButton">
                <transition name="fade-in-slow" appear>
                    <a v-if="displayLoginButton"
                            class="login"
                            :href="loginHref"
                            @click.prevent="goToLogin"
                            type="link"
                    >{{copy.common.LOG_IN}}</a>
                </transition>
                <transition name="fade-in-slow" appear>
                    <a v-if="displaySignupButton"
                            data-test="signup-button"
                            class="jump-to-form button small"
                            @click.prevent="scrollToSignup"
                            type="button"
                    >{{copy.common.SIGN_UP}}</a>
                </transition>
            </div>
            <div class="navContainer">
                <a class="navbarLink home" :href="journalHref" v-if="loggedIn">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Home to My Journal</title><path fill="#07454C" d="M5 23a3 3 0 01-3-3V9a1 1 0 01.386-.79l9-7a1 1 0 011.228 0l9 7A1 1 0 0122 9v11a3 3 0 01-3 3H5zm7-19.733L4 9.489V20a1 1 0 001 1h3v-9a1 1 0 01.883-.993L9 11h6a1 1 0 011 1v9h3a1 1 0 001-1V9.49l-8-6.223zM14 13h-4v8h4v-8z"/></svg>
                    <span class="label">Home</span>
                </a>
                <a class="navbarLink" :href="socialHref" v-if="loggedIn">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20"><title>Friends</title><path fill="#07454C" d="M13 12a5 5 0 0 1 4.995 4.783L18 17v2a1 1 0 0 1-1.993.117L16 19v-2a3 3 0 0 0-2.824-2.995L13 14H5a3 3 0 0 0-2.995 2.824L2 17v2a1 1 0 0 1-1.993.117L0 19v-2a5 5 0 0 1 4.783-4.995L5 12h8zm7.25.162a5 5 0 0 1 3.745 4.611L24 17v2a1 1 0 0 1-1.993.117L22 19v-2a3 3 0 0 0-2.25-2.902 1 1 0 1 1 .5-1.936zM9 0a5 5 0 1 1 0 10A5 5 0 0 1 9 0zm6.031.882a1 1 0 0 1 1.217-.72 5 5 0 0 1 0 9.687 1 1 0 0 1-.496-1.938 3 3 0 0 0 0-5.812 1 1 0 0 1-.72-1.217zM9 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                    <span class="label">Friends</span>
                    <!--span class="badge">3</span-->
                </a>
                <dropdown-menu :items="links" v-if="loggedIn">
                    <div class="navbar-avatar-container" slot="custom-button">
                        <div v-if="!profileImageUrl" class="initials">{{initials}}</div>
                        <img v-if="profileImageUrl" :alt="(displayName || email) + `'s Profile Image`" :src="profileImageUrl"/>
                    </div>
                </dropdown-menu>
            </div>
        </div>
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
    import CopyService from '@shared/copy/CopyService'
    import {LocalizedCopy} from '@shared/copy/CopyTypes'
    import {getRandomAvatar} from '@web/AvatarUtil'
    import {getQueryParam} from '@web/util'

    const copy = CopyService.getSharedInstance().copy;

    declare interface NavBarData {
        authUnsubscribe: (() => void) | undefined,
        user: FirebaseUser | undefined | null,
        authLoaded: boolean,
        copy: LocalizedCopy,
        hidden: boolean,
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
        beforeMount() {
            let NO_NAV = getQueryParam(QueryParam.NO_NAV);
            if (NO_NAV !== undefined) {
                this.hidden = true;
            }
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
            forceTransparent: {type: Boolean, default: false},
            loginRedirectUrl: String,
        },
        data(): NavBarData {
            return {
                copy: copy,
                user: undefined,
                authUnsubscribe: undefined,
                authLoaded: false,
                hidden: false,
            }
        },
        computed: {
            loggedIn(): boolean {
                return !!this.user;
            },
            links(): DropdownMenuLink[] {
                const links: DropdownMenuLink[] = [{
                //     title: copy.navigation.MY_JOURNAL,
                //     href: PageRoute.JOURNAL_HOME,
                // }, {
                //     title: copy.navigation.SOCIAL,
                //     href: PageRoute.SOCIAL,
                // }, {
                    title: copy.common.LOG_OUT,
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
                return (this.user && this.user.photoURL) ? this.user.photoURL : getRandomAvatar(this.user && this.user.uid || undefined);
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
                return `${PageRoute.LOGIN}?${QueryParam.REDIRECT_URL}=${this.loginRedirectUrl || window.location.href}`;
            },
            logoHref(): string {
                return this.loggedIn ? PageRoute.JOURNAL_HOME : PageRoute.HOME;
            },
            journalHref(): string {
                return PageRoute.JOURNAL_HOME;
            },
            socialHref(): string {
                return PageRoute.SOCIAL;
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

    header.loggedIn {
        display: flex;
        justify-content: space-between;
    }

    .nav-logo {
        display: block;
        height: 3.5rem;
        position: relative;
        top: 2px;
        width: 7rem;

        @include r(374) {
            height: 5.8rem;
            position: static;
            width: 11.7rem;
        }

        &.large-desktop {
            @include r(600) {
                height: 8.8rem;
                width: 17.8rem;
            }
        }
    }

    .navContainer {
        align-items: center;
        display: flex;
    }

    .navbarLink {
        align-items: center;
        display: flex;
        margin-left: 3.2rem;
        position: relative;
        text-decoration: none;

        @include r(600) {
            margin-left: 4.4rem;

            &:after {
                background-color: $green;
                bottom: -33px;
                content: "";
                height: 1px;
                left: 0;
                position: absolute;
                transform: scaleX(0);
                transition: transform .2s ease-in-out;
                width: 100%;
            }

            &:hover:after {
                transform: scaleX(1);
            }
        }

        &.home {
            display: none;

            @include r(374) {
                display: block;
            }
        }

        .icon {
            display: block;
            height: 2.4rem;
            width: 2.4rem;

            @include r(600) {
                display: none;
            }
        }

        .label {
            display: none;

            @include r(600) {
                color: $darkestGreen;
                display: block;
            }
        }
    }

    .badge {
        background-color: $green;
        border-radius: 50%;
        color: $green;
        height: .8rem;
        overflow: hidden;
        position: absolute;
        right: -.4rem;
        top: -.4rem;
        width: .8rem;
    }

    .navbar-avatar-container {
        border-radius: 50%;
        cursor: pointer;
        height: 3.2rem;
        margin-left: 3.2rem;
        overflow: hidden;
        transition: transform .2s ease-in-out;
        width: 3.2rem;

        @include r(600) {
            height: 4rem;
            margin-left: 4.4rem;
            width: 4rem;

            &:after {
                background-color: $green;
                bottom: -26px;
                content: "";
                height: 1px;
                right: 0;
                position: absolute;
                transform: scaleX(0);
                transition: transform .2s ease-in-out;
                width: 4rem;
            }

            &:hover:after {
                transform: scaleX(1);
            }
        }

        .dropdownMenuOpen & {
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

</style>
