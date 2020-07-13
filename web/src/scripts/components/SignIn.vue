<template>
    <div class="sign-up-component">
        <div>
            <h1 v-if="showTitle && !isPendingRedirect">{{_title}}</h1>
            <p class="messageSubtext" v-if="message && !isPendingRedirect">{{message}}</p>
        </div>
        <div class="actions-container">
            <magic-link :initialEmail="email" v-if="!isPendingRedirect && showMagicLink"/>
            <spinner :message="`${commonCopy.SIGNING_IN}...`" slot="body" v-if="isSigningIn" :color="spinnerColor"/>
            <div class="divider" v-if="!isPendingRedirect && showMagicLink">
                <p class="message-container">Or choose from one of the following</p>
            </div>
        </div>
        <div id="third-party-logins">
            <spinner v-if="firebaseUiLoading" :delay="1000" color="light"/>
            <div class="buttonContainer" id="signup-app"></div>
        </div>

        <div class="switcher" v-if="!isPendingRedirect && showLoginSwitcher">
            <p v-if="mode === 'LOG_IN'">
                Don't have an account?
                <router-link :to="signUpPath" :class="[switcherLinkStyle]">Sign up</router-link>
            </p>
            <p v-if="mode === 'SIGN_UP'">
                Already have an account?
                <router-link :to="loginPath" :class="[switcherLinkStyle]">Log in</router-link>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import CactusMember from '@shared/models/CactusMember'
    import { FirebaseUser } from "@web/firebase"
    import CactusMemberService from '@web/services/CactusMemberService'
    import { sendLoginEventForMember } from "@web/auth";
    import MagicLink from "@components/MagicLinkInput.vue"
    import { PageRoute } from "@shared/PageRoutes"
    import { QueryParam } from "@shared/util/queryParams"
    import Spinner from "@components/Spinner.vue";
    import { SpinnerColor } from "@components/SpinnerTypes";
    import { getQueryParam } from "@web/util"
    import StorageService, { LocalStorageKey } from '@web/services/StorageService'
    import CopyService from '@shared/copy/CopyService'
    import { CommonCopy } from '@shared/copy/CopyTypes'
    import Logger from "@shared/Logger";
    import { getAuthUI, getAuthUIConfig } from "@web/authUi";
    import { appendQueryParams, isFeatureAuthUrl } from "@shared/util/StringUtil";
    import { pushRoute } from "@web/NavigationUtil";

    const logger = new Logger("SignIn.vue");

    const locale = CopyService.getSharedInstance();
    const copy = locale.copy;

    export default Vue.extend({
        components: {
            MagicLink,
            Spinner,
        },
        mounted() {
            this.setupAuthUi();
        },
        created() {
            const ui = getAuthUI();
            if (ui.isPendingRedirect()) {
                this.isPendingRedirect = true;
                logger.log("Is pending redirect.... need to log the user in");
            }

            this.email = StorageService.getItem(LocalStorageKey.emailAutoFill) || getQueryParam(QueryParam.EMAIL) || "";
            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: (({ member, user }) => {
                    this.member = member;
                    this.user = user;
                    this.authLoaded = true;
                })
            });
        },
        beforeDestroy() {
            logger.info("beforeDestroy: resetting authUI");
            getAuthUI()?.reset();
        },
        destroyed() {
            if (this.memberListener) {
                this.memberListener();
            }

            window.clearInterval(this.checkForPendingUIInterval)
        },
        props: {
            showTitle: {
                type: Boolean,
                default: true,
            },
            spinnerColor: { type: String as () => SpinnerColor, default: "light" },
            title: String,
            message: { type: String, default: getQueryParam(QueryParam.MESSAGE), required: false },
            redirectOnSignIn: { type: Boolean, required: false, default: true },
            signInPath: { type: String, required: false },
            redirectUrl: { type: String, required: false },
            showMagicLink: { type: Boolean, default: true },
            twitterEnabled: { type: Boolean, default: true },
            showLoginSwitcher: { type: Boolean, default: true },
            switcherLinkStyle: { type: String, default: "light" },
            mode: { type: String as () => "SIGN_UP" | "LOG_IN", required: false, default: "SIGN_UP" }
        },
        data(): {
            memberListener: ListenerUnsubscriber | undefined,
            user: FirebaseUser | undefined,
            member: CactusMember | undefined,
            authLoaded: boolean,
            email: string,
            commonCopy: CommonCopy,
            isPendingRedirect: boolean,
            pendingRedirectUrl: string | undefined,
            doRedirect: boolean,
            authResult: firebase.auth.UserCredential | undefined,
            firebaseUiLoading: boolean,
            isSigningIn: boolean,
            checkForPendingUIInterval: number | undefined,
        } {
            return {
                commonCopy: copy.common,
                user: undefined,
                member: undefined,
                authLoaded: false,
                memberListener: undefined,
                email: "",
                isPendingRedirect: false,
                pendingRedirectUrl: undefined,
                doRedirect: false,
                authResult: undefined,
                firebaseUiLoading: false,
                isSigningIn: false,
                checkForPendingUIInterval: undefined,
            }
        },
        computed: {
            _title(): string {
                return this.title || copy.common.SIGN_UP
            },
            loginPath(): string {
                return PageRoute.LOGIN;
            },
            signUpPath(): string {
                return PageRoute.SIGNUP;
            },
        },
        methods: {
            checkPendingUI() {
                //is the firebase UI loading, or is it showing sign in buttons?
                if (this.isPendingRedirect) {
                    const fbList = this.$el.querySelector(".firebaseui-card-content .firebaseui-idp-list");
                    if (fbList) {
                        this.isPendingRedirect = false;
                        window.clearInterval(this.checkForPendingUIInterval)
                    }
                }
            },
            setupAuthUi() {
                this.firebaseUiLoading = true;
                const ui = getAuthUI();
                const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
                let emailLinkSignInPath = this.redirectUrl || redirectUrlParam || PageRoute.MEMBER_HOME;
                logger.info("SignIn.vue emailLinkSignInPath = ", emailLinkSignInPath);
                logger.info("SignIn.vue signInSuccessPath = ", emailLinkSignInPath);
                let includeEmailLink = false;

                const config = getAuthUIConfig({
                    includeEmailLink,
                    includeTwitter: this.twitterEnabled,
                    signInSuccessPath: this.redirectUrl || redirectUrlParam || PageRoute.MEMBER_HOME,
                    emailLinkSignInPath, //Note: normal magic link is handled in signupEndpoints.ts. This is for the special case of federated login connecting to an existing magic link acct.
                    signInSuccess: (authResult, redirectUrl) => {
                        this.isSigningIn = true;
                        logger.log("Redirect URL is", redirectUrl);
                        logger.log("Need to handle auth redirect");
                        logger.log("Sign in Operation Type ", authResult.operationType)
                        this.pendingRedirectUrl = redirectUrl;
                        this.authResult = authResult;
                        this.doRedirect = true;
                        return false;
                    },
                    signInFailure: async (error: firebaseui.auth.AuthUIError) => {
                        // alert("Sign In Failure");
                        logger.error("Sign in failure", error);
                        this.isPendingRedirect = false;
                        this.isSigningIn = false;
                    },
                    uiShown: () => {
                        this.firebaseUiLoading = false;
                    }
                });

                if (ui.isPendingRedirect()) {
                    logger.info("is pending redirect")
                    this.isPendingRedirect = true;
                    this.checkForPendingUIInterval = window.setInterval(() => {
                        this.checkPendingUI()
                    }, 500);
                } else {
                    ui.reset();
                }
                ui.start('#signup-app', config);
            }
        },
        watch: {
            twitterEnabled(current: boolean, previous?: boolean) {
                if (current !== previous) {
                    this.setupAuthUi();
                }
            },
            isPendingRedirect(pending: boolean) {
                this.$emit("loading", pending);
            },
            async doRedirect(doRedirect) {
                //TODO: make this method more clear what it does by renaming/refactoring
                if (!doRedirect) {
                    return;
                }
                if (!this.authResult || !this.authResult.user) {
                    logger.error("No auth result or auth result user found");
                    return;
                }
                const authResult = this.authResult;
                const successUrl = this.pendingRedirectUrl ?? PageRoute.MEMBER_HOME;

                logger.info("User is logged in, working on redirecting the user....")
                await Promise.all([CactusMemberService.sharedInstance.addAuthAction(async ({ member }) => {
                    logger.info("Sending login event via Auth Actions");
                    try {
                        await sendLoginEventForMember({ ...authResult, member });
                    } catch (e) {
                        logger.error("failed to log login event", e);
                    }
                }),
                    CactusMemberService.sharedInstance.addAuthAction(async ({ member }) => {
                        // append the memberId to any feature-auth urls
                        // const member = await CactusMemberService.sharedInstance.getCurrentMember();
                        let redirectUrl = successUrl;
                        if (member.id && isFeatureAuthUrl(successUrl)) {
                            redirectUrl = appendQueryParams(successUrl, { memberId: member.id });
                        }

                        if (this.redirectOnSignIn) {
                            logger.info("Auth Action: push route to ", redirectUrl)
                            return pushRoute(redirectUrl)
                        }
                    })])
            }
        }
    })
</script>
<style lang="scss">
    @import "variables";
    @import "mixins";

    .sign-up-component {
        .firebaseui-container {
            box-shadow: none;
            border: none;
            background: transparent;

            &.firebaseui-id-page-email-link-sign-in-confirmation {
                background: white;
            }
        }
    }

    .firebaseui-tos {
        color: $white;

        .firebaseui-link {
            color: $white;
        }
    }

    .firebaseui-link {
        text-decoration: underline;
    }

    .firebaseui-info-bar.firebaseui-id-info-bar {
        top: -75px;
    }

    .firebaseui-info-bar-message {
        .firebaseui-link {
            color: unset;
        }
    }

    .mdl-card.firebaseui-id-page-email-link-sign-in-confirmation {
        font-family: $font-stack;

        .firebaseui-tos-list {
            .firebaseui-link {
                color: $green;
            }
        }

    }

    .firebase-ui-card-header {
        .firebase-title {
            font-weight: bold;
        }
    }

    .firebaseui-form-actions {
        button.firebaseui-id-submit.mdl-button--raised.mdl-button--colored {
            height: unset;
            font-family: $font-stack;
            @include button;
            @include smallButton;
        }

        button.firebaseui-id-secondary-link.mdl-js-button.mdl-button--primary.firebaseui-button {
            font-family: $font-stack;
            box-shadow: none;
        }
    }


</style>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    h1 {
        margin: 0;

        @include r(600) {
            font-size: 4.8rem;
        }
    }

    .messageSubtext {
        font-size: 2rem;
        margin-bottom: 3.2rem;
        opacity: .8;

        @include r(600) {
            font-size: 2.4rem;
        }
    }

    .divider {
        margin: 0 0 2.4rem;
        opacity: .8;
    }

    .switcher {
        text-align: center;
        margin-top: 5rem;

        .dark {
            //color: $darkerGreen
        }

        .light {
            color: $white;
        }
    }

</style>
