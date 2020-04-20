<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn, loaded: authLoaded, sticky: isSticky, transparent: forceTransparent, noborder: largeLogoOnDesktop}" v-if="!hidden">
        <div class="centered">
            <a :href="logoHref"><img v-bind:class="['nav-logo', {'large-desktop': largeLogoOnDesktop}]" :src="'/assets/images/' + logoSrc" alt="Cactus logo"/></a>
            <div v-if="!loggedIn" class="anonLinks">
                <a v-if="displayLoginButton"
                        class="login "
                        :href="sponsorHref"
                        type="link"
                >
                    <span>Sponsor</span>
                </a>
                <a v-if="displayLoginButton"
                        class="login "
                        :href="loginHref"
                        @click.prevent="goToLogin"
                        type="link"
                >
                    <span>{{copy.common.LOG_IN}}</span>
                </a>
                <a v-if="displaySignupButton"
                        data-test="signup-button"
                        class="jump-to-form button small"
                        :href="signupHref"
                        @click.prevent="goToSignup"
                        type="button"
                >{{copy.common.TRY_IT_FREE}}</a>
            </div>
            <div class="navContainer" v-if="loggedIn && showLinks">
                <a class="navbarLink home" :href="journalHref" v-if="loggedIn">
                    <svg class="navIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Home to My
                        Journal</title>
                        <path fill="#07454C" d="M5 23a3 3 0 01-3-3V9a1 1 0 01.386-.79l9-7a1 1 0 011.228 0l9 7A1 1 0 0122 9v11a3 3 0 01-3 3H5zm7-19.733L4 9.489V20a1 1 0 001 1h3v-9a1 1 0 01.883-.993L9 11h6a1 1 0 011 1v9h3a1 1 0 001-1V9.49l-8-6.223zM14 13h-4v8h4v-8z"/>
                    </svg>
                    <span class="navLabel">{{copy.navigation.HOME}}</span>
                </a>
                <a class="navbarLink" :href="socialHref" v-if="loggedIn">
                    <svg class="navIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Activity</title>
                        <path fill="#07454C" d="M15 17.838L9.949 2.684c-.304-.912-1.594-.912-1.898 0L5.28 11H2a1 1 0 000 2h4a1 1 0 00.949-.684L9 6.162l5.051 15.154c.304.912 1.594.912 1.898 0L18.72 13H22a1 1 0 000-2h-4a1 1 0 00-.949.684L15 17.838z"/>
                    </svg>
                    <span class="navLabel">{{copy.navigation.ACTIVITY}}</span>
                    <span class="badge" v-if="activityBadgeCount > 0" data-test="badge">{{activityBadgeCount}}</span>
                </a>
                <dropdown-menu :items="links" v-if="loggedIn" :displayName="displayName" :email="email">
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
    import { getInitials, isBlank } from '@shared/util/StringUtil'
    import {PageRoute} from '@shared/PageRoutes'
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
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from "@shared/models/CactusMember"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {fetchActivityFeedSummary} from '@web/social';
    import StorageService, {LocalStorageKey} from "@web/services/StorageService";
    import MemberProfile from "@shared/models/MemberProfile"
    import MemberProfileService from '@web/services/MemberProfileService'
    import Logger from "@shared/Logger";
    import { isPremiumTier, subscriptionTierDisplayName } from "@shared/models/MemberSubscription";

    const logger = new Logger("NavBar.vue");
    const copy = CopyService.getSharedInstance().copy;

    declare interface NavBarData {
        authUnsubscribe: (() => void) | undefined,
        user: FirebaseUser | undefined | null,
        member: CactusMember | undefined,
        memberUnsubscriber: ListenerUnsubscriber | undefined,
        authLoaded: boolean,
        copy: LocalizedCopy,
        hidden: boolean,
        memberProfile: MemberProfile | undefined,
        memberProfileUnsubscriber: ListenerUnsubscriber | undefined,
        activityBadgeCount: number,
    }

    export default Vue.extend({
        directives: {
            'click-outside': clickOutsideDirective(),
        },
        components: {
            DropdownMenu,
        },
        beforeMount() {
            let NO_NAV = getQueryParam(QueryParam.NO_NAV);
            if (!isBlank(NO_NAV)) {
                this.hidden = true;
            }

            this.authUnsubscribe = getAuth().onAuthStateChanged(user => {
                this.user = user;
                this.authLoaded = true;
            });

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({member}) => {
                    if (member?.id && member?.id !== this.member?.id) {
                        this.memberProfileUnsubscriber?.();
                        this.memberProfileUnsubscriber = MemberProfileService.sharedInstance.observeByMemberId(member?.id, {
                            onData: profile => {
                                this.memberProfile = profile;
                            }
                        })
                    }

                    const oldMember = this.member;
                    this.member = member;
                    if (member && member.activityStatus?.lastSeenOccurredAt !== oldMember?.activityStatus?.lastSeenOccurredAt || member?.id !== oldMember?.id) {
                        await this.updateActivityCount();
                    }
                }
            });
        },
        destroyed() {
            this.authUnsubscribe?.();
            this.memberUnsubscriber?.();
            this.memberProfileUnsubscriber?.();
        },
        props: {
            showSignup: {type: Boolean, default: false},
            signOutRedirectUrl: String,
            redirectOnSignOut: Boolean,
            signupFormAnchorId: {type: String, default: "signupAnchor"},
            largeLogoOnDesktop: Boolean,
            isSticky: {type: Boolean, default: true},
            whiteLogo: {type: Boolean, default: false},
            showLogin: {type: Boolean, default: true},
            forceTransparent: {type: Boolean, default: false},
            loginRedirectUrl: String,
            showLinks: {type: Boolean, default: true},
        },
        data(): NavBarData {
            return {
                copy: copy,
                user: undefined,
                authUnsubscribe: undefined,
                authLoaded: false,
                hidden: false,
                member: undefined,
                memberUnsubscriber: undefined,
                activityBadgeCount: StorageService.getNumber(LocalStorageKey.activityBadgeCount, 0)!,
                memberProfileUnsubscriber: undefined,
                memberProfile: undefined,
            }
        },
        computed: {
            loggedIn(): boolean {
                return !!this.user;
            },
            links(): DropdownMenuLink[] {
                const links: DropdownMenuLink[] = [{
                    title: copy.navigation.CORE_VALUES,
                    href: PageRoute.CORE_VALUES,
                    calloutText: !isPremiumTier(this.member?.tier) ? "Plus" : null
                }, {
                    title: copy.navigation.ACCOUNT,
                    href: PageRoute.ACCOUNT,
                    badge: subscriptionTierDisplayName(this.member?.tier, this.member?.isOptInTrialing)
                },{
                    title: copy.common.LOG_OUT,
                    onClick: async () => {
                        await this.logout()
                    }
                }];

                return links;
            },
            displayName(): string | undefined | null {
                return this.member ? this.member.getFullName() : null;
            },
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            },
            profileImageUrl(): string | undefined | null {
                return (this.memberProfile?.avatarUrl) ? this.memberProfile.avatarUrl : getRandomAvatar(this.member?.id);
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
            isPaidTier(): boolean {
                return isPremiumTier(this.member?.tier);
            },
            sponsorHref(): string {
                return PageRoute.SPONSOR;
            },
            signupHref(): string {
                return PageRoute.SIGNUP;
            },
            journalHref(): string {
                return PageRoute.JOURNAL_HOME;
            },
            socialHref(): string {
                return PageRoute.SOCIAL;
            },
            logoSrc(): string {
                return this.whiteLogo ? "logoWhite.svg" : "logo.svg";
            }
        },
        methods: {
            async logout(): Promise<void> {
                logger.log('Logging out...');
                await logout({redirectUrl: this.signOutRedirectUrl || "/", redirectOnSignOut: this.redirectOnSignOut})
            },
            goToLogin() {
                window.location.href = this.loginHref;
            },
            goToSignup() {
                window.location.href = this.signupHref;
            },
            scrollToSignup() {
                if (!this.signupFormAnchorId) {
                    return;
                }

                const scrollToId = this.signupFormAnchorId;

                const content = document.getElementById(scrollToId);
                gtag("event", "scroll_to", {formId: this.signupFormAnchorId});
                if (content) content.scrollIntoView();
            },
            async updateActivityCount() {
                logger.log("Refreshing activity count");
                const member = this.member;
                if (!member) {
                    return;
                }

                const activitySummary = await fetchActivityFeedSummary();
                if (!activitySummary) {
                    logger.error("Failed to fetch activity summary");
                    this.activityBadgeCount = 0;
                    return;
                }
                this.activityBadgeCount = activitySummary.unseenCount;
                StorageService.saveNumber(LocalStorageKey.activityBadgeCount, activitySummary.unseenCount);
            }
        }
    })
</script>

<style lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";

    body.error header {
        background: $white;
    }

    .anonLinks {
        align-items: center;
        display: flex;
        flex-grow: 1;
        justify-content: flex-end;
        white-space: nowrap;

        .login {
            display: block;
            font-size: 1.6rem;
            margin: 0;
            padding-left: 3vw;
            text-decoration: none;
            transition: background-color .2s ease-in-out;

            @include r(600) {
                font-size: 1.8rem;

                &:last-child {
                    border: 1px solid $lightGreen;
                    border-radius: 3rem;
                    margin-left: 3.2vw;
                    padding: .8rem 1.6rem;

                    &:hover {
                        background-color: $lightGreen;
                    }
                }
            }
        }

        a.button.small {
            background-color: transparent;
            color: $darkGreen;
            flex-grow: 0;
            margin: 0;
            padding: 0 0 0 3vw;

            @include r(374) {
                background-color: $green;
                color: $white;
                margin-left: 2.4vw;
                padding: .6rem 1.2rem;
            }
            @include r(600) {
                font-size: 1.8rem;
                margin-left: 3.2vw;
                padding: .8rem 1.6rem;
            }
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
        padding: 0 1.6rem;
        position: relative;
        text-decoration: none;

        @include r(600) {
            padding: 0 2.4rem;

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

        .navIcon {
            display: block;
            height: 2.4rem;
            width: 2.4rem;

            @include r(600) {
                display: none;
            }
        }

        .navLabel {
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
        color: $white;
        font-size: 60%;
        height: 2rem;
        overflow: hidden;
        position: absolute;
        right: 0;
        top: -0.5rem;
        width: 2rem;
        line-height: 180%;
        text-align: center;
        font-weight: bold;
    }

    .navbar-avatar-container {
        cursor: pointer;
        height: 3.2rem;
        overflow: hidden;
        padding-left: 1.6rem;
        transition: transform .2s ease-in-out;

        @include r(600) {
            padding-left: 2.4rem;

            &:after {
                background-color: $green;
                bottom: -30px;
                content: "";
                height: 1px;
                right: -1.2rem;
                position: absolute;
                transform: scaleX(0);
                transition: transform .2s ease-in-out;
                width: 5.6rem;
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
            border-radius: 50%;
            height: 3.2rem;
            width: 3.2rem;
        }
    }

</style>
