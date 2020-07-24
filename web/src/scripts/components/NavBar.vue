<template lang="html">
    <header v-bind:class="mainClasses" v-if="!hidden">
        <div class="centered">
            <router-link :to="logoHref" class="nav-logo-container">
                <img v-bind:class="['nav-logo', {'large-desktop': largeLogoOnDesktop}]" :src="logoSrc" alt="Cactus logo"/>
            </router-link>
            <div v-if="!loggedIn" class="anonLinks">
                <router-link
                        v-if="displayLoginButton"
                        :to="pricingHref"
                        type="link"
                        class="navbarLink"
                >
                    <span>Pricing</span>
                </router-link>
                <router-link v-if="displayLoginButton"
                        :to="loginHref"
                        @click.prevent="goToLogin"
                        type="link"
                        class="navbarLink"
                >
                    <span>{{copy.common.LOG_IN}}</span>
                </router-link>
                <router-link v-if="displayLoginButton"
                        :to="signupHref"
                        tag="button"
                        class="small"
                >
                    <span>{{copy.common.SIGN_UP}}</span>
                </router-link>
            </div>
            <div class="navContainer" v-if="loggedIn && showLinks">
                <router-link class="navbarLink home" :to="memberHomeHref" v-if="loggedIn">
                    <svg class="navIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Home</title>
                        <path fill="#07454C" d="M5 23a3 3 0 01-3-3V9a1 1 0 01.386-.79l9-7a1 1 0 011.228 0l9 7A1 1 0 0122 9v11a3 3 0 01-3 3H5zm7-19.733L4 9.489V20a1 1 0 001 1h3v-9a1 1 0 01.883-.993L9 11h6a1 1 0 011 1v9h3a1 1 0 001-1V9.49l-8-6.223zM14 13h-4v8h4v-8z"/>
                    </svg>
                    <span class="navLabel">{{copy.navigation.HOME}}</span>
                </router-link>
                <router-link class="navbarLink" :to="journalHref" v-if="loggedIn">
                    <svg class="navIcon journal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 22">
                        <title>Journal</title>
                        <path fill="#07454C" d="M7.636 0c1.785 0 3.37.857 4.365 2.182A5.44 5.44 0 0116.364 0h6.545C23.512 0 24 .488 24 1.09v16.365a1.09 1.09 0 01-1.09 1.09h-7.637a2.182 2.182 0 00-2.177 2.026l-.005.156c0 1.455-2.182 1.455-2.182 0a2.182 2.182 0 00-2.182-2.182H1.091A1.09 1.09 0 010 17.455V1.09C0 .488.488 0 1.09 0h6.546zm0 2.182H2.182v14.182h6.545c.696 0 1.353.162 1.937.452l.245.131V5.455a3.273 3.273 0 00-3.273-3.273zm14.182 0h-5.454a3.273 3.273 0 00-3.273 3.273v11.492a4.344 4.344 0 012.182-.583h6.545V2.182zM7.636 12.545a1.09 1.09 0 010 2.182H4.364a1.09 1.09 0 110-2.182zm1.091-4.363a1.09 1.09 0 110 2.182H4.364a1.09 1.09 0 010-2.182zm-1.09-4.364a1.09 1.09 0 010 2.182H4.363a1.09 1.09 0 110-2.182z"/>
                    </svg>
                    <span class="navLabel">{{copy.navigation.JOURNAL}}</span>
                </router-link>
                <compose-button v-if="member" :member="member" />
                <dropdown-menu
                        v-if="loggedIn"
                        :items="links"
                        :displayName="displayName"
                        :email="email"
                        :hide-on-route-change="true"
                >
                    <div class="navbar-avatar-container" slot="custom-button">
                        <div v-if="!profileImageUrl" class="initials">{{initials}}</div>
                        <img @error="avatarImageError = true" v-if="profileImageUrl" alt="Account" :src="profileImageUrl"/>
                    </div>
                </dropdown-menu>
            </div>
        </div>
    </header>
</template>

<script lang="ts">
    import Vue from "vue";
    import { FirebaseUser, getAuth } from '@web/firebase'
    import { getInitials, isBlank } from '@shared/util/StringUtil'
    import { PageRoute } from '@shared/PageRoutes'
    import { clickOutsideDirective } from '@web/vueDirectives'
    import { logout } from '@web/auth'
    import DropdownMenu from "@components/DropdownMenu.vue"
    import { DropdownMenuLink } from "@components/DropdownMenuTypes"
    import { QueryParam } from '@shared/util/queryParams'
    import CopyService from '@shared/copy/CopyService'
    import { getRandomAvatar } from '@web/AvatarUtil'
    import { getQueryParam } from '@web/util'
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from "@shared/models/CactusMember"
    import { ListenerUnsubscriber } from '@web/services/FirestoreService';
    import MemberProfile from "@shared/models/MemberProfile"
    import MemberProfileService from '@web/services/MemberProfileService'
    import Logger from "@shared/Logger";
    import { isPremiumTier, subscriptionTierDisplayName } from "@shared/models/MemberSubscription";
    import { pushRoute } from "@web/NavigationUtil";
    import SvgIcon from "@components/SvgIcon.vue";
    import Component from "vue-class-component";
    import { Prop, Watch } from "vue-property-decorator";
    import { NavBarProps } from "@components/NavBarTypes";
    import ComposeButton from "@components/freeform/ComposeButton.vue";

    const logger = new Logger("NavBar");
    const copy = CopyService.getSharedInstance().copy;

    @Component({
        directives: {
            'click-outside': clickOutsideDirective(),
        },
        components: {
            ComposeButton,
            SvgIcon,
            DropdownMenu,
        }
    })
    export default class NavBar extends Vue implements NavBarProps {
        name = "NavBar";

        @Prop({ type: Boolean, default: false })
        showSignup!: boolean;

        @Prop({ type: String, default: null, required: false })
        signOutRedirectUrl!: string | null;

        @Prop({ type: Boolean, default: true })
        redirectOnSignOut!: boolean;

        @Prop({ type: String, default: "signupAnchor" })
        signupFormAnchorId!: string;

        @Prop({ type: Boolean, default: false })
        largeLogoOnDesktop!: boolean;

        @Prop({ type: Boolean, default: false })
        isSticky!: boolean;

        @Prop({ type: Boolean, default: false })
        whiteLogo!: boolean;

        @Prop({ type: Boolean, default: true })
        showLogin!: boolean;

        @Prop({ type: Boolean, default: false })
        forceTransparent!: boolean;

        @Prop({ type: String, default: null })
        loginRedirectUrl!: string | null;

        @Prop({ type: Boolean, default: false })
        useCurrentRouteAfterLogin!: boolean;

        @Prop({ type: Boolean, default: true })
        showLinks!: boolean;

        copy = copy;
        user: FirebaseUser | null | undefined = null;
        authUnsubscribe: ListenerUnsubscriber | undefined = undefined;
        authLoaded: boolean = false;
        hidden = false;
        member: CactusMember | undefined = undefined;
        memberUnsubscriber: ListenerUnsubscriber | undefined = undefined;
        memberProfileUnsubscriber: ListenerUnsubscriber | undefined = undefined;
        memberProfile: MemberProfile | undefined = undefined;
        avatarImageError = false;

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
                onData: async ({ member }) => {
                    if (member?.id && member?.id !== this.member?.id) {
                        this.memberProfileUnsubscriber?.();
                        this.memberProfileUnsubscriber = MemberProfileService.sharedInstance.observeByMemberId(member?.id, {
                            onData: profile => {
                                this.memberProfile = profile;
                            }
                        })
                    }

                    this.member = member;
                }
            });
        }

        beforeDestroy() {
            this.authUnsubscribe?.();
            this.memberUnsubscriber?.();
            this.memberProfileUnsubscriber?.();
        }

        get mainClasses(): Record<string, boolean> {
            return {
                loggedIn: this.loggedIn,
                loaded: this.authLoaded,
                sticky: this.isSticky,
                transparent: this.forceTransparent,
                noborder: this.largeLogoOnDesktop
            }
        }

        get loggedIn(): boolean {
            return !!this.user;
        }

        get links(): DropdownMenuLink[] {
            return [{
                title: copy.navigation.ACCOUNT,
                href: PageRoute.ACCOUNT,
                badge: subscriptionTierDisplayName(this.member?.tier, this.member?.isOptInTrialing)
            }, {
                title: copy.common.LOG_OUT,
                onClick: async () => {
                    this.$emit("logging-out")
                    await this.logout()
                }
            }];
        }

        get displayName(): string | undefined | null {
            return this.member ? this.member.getFullName() : null;
        }

        get email(): string | undefined | null {
            return this.user ? this.user.email : null;
        }

        get profileImageUrl(): string | undefined | null {

            return (!this.avatarImageError && this.memberProfile?.avatarUrl) ? this.memberProfile.avatarUrl : getRandomAvatar(this.member?.id);
        }

        get displayLoginButton(): boolean {
            return this.showLogin && this.authLoaded && !this.user;
        }

        get initials(): string {
            if (this.user) {
                return getInitials(this.user.displayName || this.user.email || "")
            }
            return "";
        }

        get loginHref(): string {
            let successUrl = this.loginRedirectUrl ?? PageRoute.MEMBER_HOME;
            if (this.useCurrentRouteAfterLogin) {
                successUrl = window.location.href;
            }

            return `${ PageRoute.LOGIN }?${ QueryParam.REDIRECT_URL }=${ successUrl }`;
        }

        get logoHref(): string {
            return this.loggedIn ? PageRoute.MEMBER_HOME : PageRoute.HOME;
        }

        get isPaidTier(): boolean {
            return isPremiumTier(this.member?.tier);
        }

        get sponsorHref(): string {
            return PageRoute.SPONSOR;
        }

        get signupHref(): string {
            return PageRoute.SIGNUP;
        }

        get assessmentHref(): string {
            return PageRoute.GAP_ANALYSIS;
        }

        get memberHomeHref(): string {
            return PageRoute.MEMBER_HOME;
        }

        get journalHref(): string {
            return PageRoute.JOURNAL;
        }

        get logoSrc(): string {
            return `/assets/images/${ this.whiteLogo ? "logoWhite.svg" : "logo.svg" }`;
        }

        get insightsHref(): string {
            return PageRoute.INSIGHTS
        }

        get pricingHref(): string {
            return PageRoute.PRICING;
        }


        async logout(): Promise<void> {
            logger.log('Logging out...');
            try {
                await logout({
                    redirectUrl: this.signOutRedirectUrl || "/",
                    redirectOnSignOut: this.redirectOnSignOut
                })
            } catch (error) {
                logger.error("Log out threw an error", error);
            }
        }

        async goToLogin() {
            await pushRoute(this.loginHref);
        }

        async goToSignup() {
            await pushRoute(this.signupHref);
        }


    }
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "transitions";

    body.error header {
        background: $white;
    }

    .anonLinks {
        align-items: center;
        display: flex;
        flex-grow: 1;
        justify-content: flex-end;
        white-space: nowrap;

        .navbarLink {
            font-size: 1.6rem;
            margin: 0 .8rem;
            padding: 0;

            @include r(600) {
                font-size: 1.8rem;
                margin: 0 1.6rem;
                padding: 3.2rem 0;
            }
        }

        button.small {
            flex-grow: 0;
            margin-left: .8rem;

            @include r(600) {
                margin-left: 1.6rem;
            }
        }
    }

    header.loggedIn {
        display: flex;
        justify-content: space-between;
    }

    .nav-logo-container {
        display: block;
        padding: .8rem .8rem .8rem 0;

        @include r(600) {
            padding: 1.6rem 1.6rem 1.6rem 0;
        }
    }

    .nav-logo {
        display: block;    
        height: auto;
        top: 2px;
        width: 24vw;

        @include r(600) {
            height: 5.8rem;
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
        padding: 1.6rem;
        position: relative;
        text-decoration: none;

        @include r(600) {
            margin: 0 1.6rem;
            padding: 3.2rem 0;

            &:after {
                background-color: $green;
                bottom: -1px;
                content: "";
                height: 1px;
                left: 0;
                position: absolute;
                transform: scaleX(0);
                transition: transform .2s ease-in-out;
                width: 100%;
            }

            &:hover:after, &.router-link-active:after {
                transform: scaleX(1);
            }
        }

        .navIcon {
            display: block;
            height: 2.4rem;
            width: 2.4rem;

            &.journal {
                margin-top: 1px;
            }

            @include r(600) {
                display: none;
            }

            path {
                fill: #07454C;
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
            margin-left: 1.6rem;
            padding-left: 0;

            &:after {
                background-color: $green;
                bottom: -30px;
                content: "";
                height: 1px;
                right: 0;
                position: absolute;
                transform: scaleX(0);
                transition: transform .2s ease-in-out;
                width: 100%;
            }

            &:hover:after, &.router-link-active:after {
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
