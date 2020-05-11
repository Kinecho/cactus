<template>
    <div class="centered">
        <div>
            <h1 v-if="showTitle && !isPendingRedirect">{{_title}}</h1>
            <p class="messageSubtext" v-if="message && !isPendingRedirect">{{message}}</p>
        </div>
        <div class="actions-container">
            <magic-link :initialEmail="email" v-if="!isPendingRedirect && showMagicLink"/>
            <spinner :message="`${commonCopy.SIGNING_IN}...`" slot="body" v-if="isSigningIn" color="light"/>
            <div class="divider" v-if="!isPendingRedirect && showMagicLink">
                <p class="message-container">Or choose from one of the following</p>
            </div>
        </div>
        <div id="third-party-logins">
            <spinner v-if="firebaseUiLoading" :delay="1000" color="light"/>
            <div class="buttonContainer" id="signup-app"></div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import CactusMember from '@shared/models/CactusMember'
    import { FirebaseUser } from "@web/firebase"
    import CactusMemberService from '@web/services/CactusMemberService'
    import { sendLoginEvent } from "@web/auth";
    import MagicLink from "@components/MagicLinkInput.vue"
    import { PageRoute } from "@shared/PageRoutes"
    import { QueryParam } from "@shared/util/queryParams"
    import Spinner from "@components/Spinner.vue";
    import { getQueryParam } from "@web/util"
    import StorageService, { LocalStorageKey } from '@web/services/StorageService'
    import CopyService from '@shared/copy/CopyService'
    import { CommonCopy } from '@shared/copy/CopyTypes'
    import Logger from "@shared/Logger";
    import { getAuthUI, getAuthUIConfig } from "@web/authUi";
    import { appendQueryParams, isFeatureAuthUrl } from "@shared/util/StringUtil";
    import { pushRoute } from "@web/NavigationUtil";

    const logger = new Logger("SignIn.vue");
    const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
    logger.log("Redirect url param is ", redirectUrlParam);
    let emailLinkRedirectUrl: string = PageRoute.SIGNUP_CONFIRMED;
    if (redirectUrlParam) {
        emailLinkRedirectUrl = `${ emailLinkRedirectUrl }?${ QueryParam.REDIRECT_URL }=${ redirectUrlParam }`
    }

    const locale = CopyService.getSharedInstance();
    const copy = locale.copy;

    export default Vue.extend({
        components: {
            MagicLink,
            Spinner,
        },
        mounted() {
            this.firebaseUiLoading = true;
            const ui = getAuthUI();
            let emailLinkSignInPath = this.redirectUrl || redirectUrlParam || PageRoute.JOURNAL_HOME;
            let includeEmailLink = false;
            if (ui.isPendingRedirect()) {
                includeEmailLink = true;
                emailLinkSignInPath = PageRoute.LOGIN;
            }

            const config = getAuthUIConfig({
                includeEmailLink,
                includeTwitter: this.twitterEnabled,
                signInSuccessPath: this.redirectUrl || redirectUrlParam || PageRoute.JOURNAL_HOME,
                emailLinkSignInPath, //Note: normal magic link is handled in signupEndpoints.ts. This is for the special case of federated login connecting to an existing magic link acct.
                signInSuccess: (authResult, redirectUrl) => {
                    this.isSigningIn = true;
                    logger.log("Redirect URL is", redirectUrl);
                    logger.log("Need to handle auth redirect");
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
                    logger.info("Firebase UI shown", ui);
                    logger.info("UI Shown... is pending redirect? ", ui.isPendingRedirect());
                    this.firebaseUiLoading = false;
                }
            });

            if (ui.isPendingRedirect()) {
                this.isPendingRedirect = true;
                logger.log("Is pending redirect.... need to log the user in");

                this.checkForPendingUIInterval = window.setInterval(() => {
                    this.checkPendingUI()
                }, 500);
            } else {
                ui.reset();
            }

            // ui.reset();
            ui.start('#signup-app', config);
        },
        created() {
            const ui = getAuthUI();
            if (ui.isPendingRedirect()) {
                this.isPendingRedirect = true;
                logger.log("Is pending redirect.... need to log the user in");
            }

            // this.message = getQueryParam(QueryParam.MESSAGE) || undefined;
            this.email = StorageService.getItem(LocalStorageKey.emailAutoFill) || getQueryParam(QueryParam.EMAIL) || "";

            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: (({ member, user }) => {
                    this.member = member;
                    this.user = user;
                    this.authLoaded = true;
                })
            });
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
            title: String,
            message: { type: String, default: getQueryParam(QueryParam.MESSAGE), required: false },
            redirectOnSignIn: { type: Boolean, required: false, default: true },
            signInPath: { type: String, required: false },
            redirectUrl: { type: String, required: false },
            showMagicLink: { type: Boolean, default: true },
            twitterEnabled: {type: Boolean, default: true},
        },
        data(): {
            message: string | undefined,
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
                message: undefined,
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
            }
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
            }
        },
        watch: {
            async doRedirect(doRedirect) {
                //TODO: probalby make this method more clear what it does by renaming/refactoring
                if (!doRedirect) {
                    return;
                }
                if (this.authResult && this.authResult.user) {
                    try {
                        await sendLoginEvent(this.authResult)
                    } catch (e) {
                        logger.error("failed to log login event", e);
                    } finally {
                        // append the memberId to any feature-auth urls
                        if (this.member?.id && this.pendingRedirectUrl && isFeatureAuthUrl(this.pendingRedirectUrl)) {
                            this.pendingRedirectUrl = appendQueryParams(this.pendingRedirectUrl, { memberId: this.member.id });
                        }

                        if (this.redirectOnSignIn) {
                            await pushRoute(this.pendingRedirectUrl || PageRoute.JOURNAL_HOME)
                        }
                    }
                }
            }
        }
    })
</script>

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

        @include r(600) {
            font-size: 2.4rem;
        }
    }

    .centered {
        position: relative;
        z-index: 1;
        padding: 6.4rem 2.4rem 0;

        @include r(600) {
            padding: 12rem 0 0;
        }
    }

    .divider {
        margin: 0 0 2.4rem;
        opacity: .8;
    }
</style>
