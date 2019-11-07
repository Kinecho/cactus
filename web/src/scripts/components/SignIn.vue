<template>
    <div>
        <div class="centered">
            <div>
                <h1 v-if="showTitle && !isPendingRedirect">{{_title}}</h1>
                <p v-if="message">{{message}}</p>
            </div>
            <div class="actions-container">
                <magic-link :initialEmail="email" v-if="!isPendingRedirect"/>
                <spinner :message="`${commonCopy.SIGNING_IN}...`" slot="body" v-if="isSigningIn"/>
                <div class="divider" v-if="!isPendingRedirect">
                    <p class="message-container">Or choose from one of the following</p>
                </div>
            </div>
            <div id="third-party-logins">
                <spinner v-if="firebaseUiLoading" :delay="1000"/>
                <div class="buttonContainer" id="signup-app"></div>
            </div>
        </div>
        <img id="pinkBlob" src="assets/images/pinkBlob.svg" alt=""/>
        <img id="yellowBlob1" src="assets/images/yellowNeedleBlob.svg" alt=""/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMember from '@shared/models/CactusMember'
    import {FirebaseUser} from "@web/firebase"
    import CactusMemberService from '@web/services/CactusMemberService'
    import {getAuthUI, getAuthUIConfig, sendLoginEvent} from "@web/auth";
    import MagicLink from "@components/MagicLinkInput.vue"
    import {PageRoute} from "@web/PageRoutes"
    import {QueryParam} from "@shared/util/queryParams"
    import Spinner from "@components/Spinner.vue";
    import {getQueryParam} from "@web/util"
    import StorageService, {LocalStorageKey} from '@web/services/StorageService'
    import CopyService from '@shared/copy/CopyService'
    import {CommonCopy} from '@shared/copy/CopyTypes'

    const redirectUrlParam = getQueryParam(QueryParam.REDIRECT_URL);
    console.log("Redirect url param is ", redirectUrlParam);
    let emailLinkRedirectUrl: string = PageRoute.SIGNUP_CONFIRMED;
    if (redirectUrlParam) {
        emailLinkRedirectUrl = `${emailLinkRedirectUrl}?${QueryParam.REDIRECT_URL}=${redirectUrlParam}`
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
            let emailLinkSignInPath = redirectUrlParam || PageRoute.JOURNAL_HOME;
            let includeEmailLink = false;
            if (ui.isPendingRedirect()) {
                includeEmailLink = true;
                emailLinkSignInPath = PageRoute.LOGIN;
            }

            const config = getAuthUIConfig({
                includeEmailLink,
                signInSuccessPath: redirectUrlParam || PageRoute.JOURNAL_HOME,
                emailLinkSignInPath, //Note: normal magic link is handled in signupEndpoints.ts. This is for the special case of federated login connecting to an existing magic link acct.
                signInSuccess: (authResult, redirectUrl) => {
                    this.isSigningIn = true;
                    console.log("Redirect URL is", redirectUrl);
                    console.log("Need to handle auth redirect");
                    this.pendingRedirectUrl = redirectUrl;
                    this.authResult = authResult;
                    this.doRedirect = true;
                    return false;
                },
                signInFailure: async (error: firebaseui.auth.AuthUIError) => {
                    alert("Sign In Failure");
                    console.error("Sign in failure", error);
                },
                uiShown: () => {
                    this.firebaseUiLoading = false;
                }
            });

            if (ui.isPendingRedirect()) {
                this.isPendingRedirect = true;
                console.log("Is pending redirect.... need to log the user in");
            }
            ui.start('#signup-app', config);
        },
        created() {
            const ui = getAuthUI();
            if (ui.isPendingRedirect()) {
                this.isPendingRedirect = true;
                console.log("Is pending redirect.... need to log the user in");
            }

            this.message = getQueryParam(QueryParam.MESSAGE) || undefined;
            this.email = StorageService.getItem(LocalStorageKey.emailAutoFill) || getQueryParam(QueryParam.EMAIL) || "";

            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: (({member, user}) => {
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
        },
        props: {
            showTitle: {
                type: Boolean,
                default: true,
            },
            title: String,
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
            }
        },
        computed: {
            _title(): string {
                return this.title || copy.common.SIGN_UP
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
                        console.error("failed to log login event", e);
                    } finally {
                        window.location.href = this.pendingRedirectUrl || PageRoute.JOURNAL_HOME;
                    }
                }
            }
        }
    })


</script>

<style lang="scss">
    @import "mixins";
    @import "variables";


    #signup-app {
        margin: 0 -24px 0;

        @include r(600) {
            margin: 0 auto 0;
        }

        .firebaseui-container {
            box-shadow: none;
            max-width: 50rem;

            .mdl-progress.firebaseui-busy-indicator {
                top: 25px;
            }

            [data-provider-id="password"] {
                display: none;
            }

            &.firebaseui-id-page-email-link-sign-in-sent, &.firebaseui-id-page-email-not-received {
                .firebaseui-id-secondary-link {
                    display: none;
                }
            }

            &.firebaseui-id-page-password-recovery-email-sent {
                button.firebaseui-id-submit {
                    display: none;
                }
            }

            &.firebaseui-id-page-password-recovery {
                .firebaseui-id-info-bar, firebaseui-info-bar {
                    top: -3.2rem;
                }

                .firebaseui-id-secondary-link {
                    display: none;
                }
            }

            .firebaseui-card-actions {
                .firebaseui-form-actions {

                    .mdl-button, .firebaseui-button, .firebaseui-button.firebaseui-id-submit.mdl-button.mdl-button--colored.mdl-button--raised.mdl-js-button {
                        height: unset;
                        @include button;
                        text-transform: none;


                        &.firebaseui-id-secondary-link {
                            @include button;
                            @include secondaryButton;
                        }

                        &:not(:last-child) {
                            margin-right: 1rem;
                        }

                    }


                    /*button.firebaseui-id-submit, button.mdl-button, .mdl-button--raised.mdl-button--colored {*/
                    /*    */
                    /*}*/
                }

            }

            .firebaseui-card-header {
                .firebaseui-title {
                    display: none;
                }
            }


        }

    }
</style>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";


    h1 {
        margin: 0;
    }

    form {
        display: flex;
        flex-flow: column wrap;
        margin: 0 auto;
        max-width: 70rem;
        padding: 2.4rem 0;

        @include r(600) {
            flex-direction: row;
            padding: 2.4rem;
        }
    }

    .centered {
        position: relative;
        z-index: 1;
        padding: 2.4rem;

        @include r(600) {
            padding: 6.4rem 0;
        }
    }

    .divider {
        margin: 2rem 0;
        @include maxW(600) {
            font-size: 1.6rem;
        }
    }

    #yellowBlob1 {
        bottom: 3vh;
        height: auto;
        left: -180px;
        position: absolute;
        width: 360px;
    }

    #pinkBlob {
        height: auto;
        position: absolute;
        right: -90px;
        top: 24px;
        transform: rotate(-165deg);
        width: 180px;
    }

</style>
