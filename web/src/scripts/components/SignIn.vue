<template>
    <div>
        <div class="centered">
            <div>
                <h1>{{title}}</h1>
                <p v-if="message">{{message}}</p>
            </div>
            <div class="actions-container" v-if="!loading">
                <magic-link :initialEmail="email"/>
                <div id="third-party-loading" class="loading hidden">
                    <img src="/assets/images/loading.svg" alt=""/>{{commonCopy.SIGNING_IN}}...
                </div>
                <div class="divider hidden">
                    <p class="message-container">Or choose from one of the following:</p>
                </div>
                <div id="third-party-logins">
                    <div class="buttonContainer" id="signup-app"></div>
                </div>
            </div>
            <div v-if="loading">
                <spinner/>
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
    import {getAuthUI, getAuthUIConfig} from "@web/auth";
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

    const ui = getAuthUI();
    const config = getAuthUIConfig({
        signInSuccessPath: redirectUrlParam || PageRoute.JOURNAL_HOME,
        emailLinkSignInPath: redirectUrlParam || PageRoute.JOURNAL_HOME, //Note: email link is currently implemented in auth.js and we don't use firebaseUI
        signInSuccess: (authResult, redirectUrl) => {
            console.log("Redirect URL is", redirectUrl);
            console.log("Letting fbui handle the redirect... just returning true");
            return true;
        }
    });


    const locale = CopyService.getSharedInstance();
    const copy = locale.copy;

    export default Vue.extend({
        components: {
            MagicLink,
            Spinner,
        },
        created() {
            this.message = getQueryParam(QueryParam.MESSAGE) || undefined;
            this.email = StorageService.getItem(LocalStorageKey.emailAutoFill) || getQueryParam(QueryParam.EMAIL) || "";

            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: (({member, user}) => {
                    this.member = member;
                    this.user = user;
                    this.authLoaded = true;
                })
            });
            if (ui.isPendingRedirect()) {
                console.log("Is pending redirect.... need to log the user in");
                this.loading = true;
                // if ($loading) $loading.classList.remove("hidden");
                // if ($emailContainer) $emailContainer.classList.add("hidden");
                // if ($divider) $divider.classList.add("hidden");
                // if ($welcomeMessage) $welcomeMessage.classList.add("hidden");
                // if ($loginContainer) {
                //     $loginContainer.style.height = "0";
                //     $loginContainer.style.opacity = "0";
                // }

                ui.start('#signup-app', config);
            } else {
                // if ($emailContainer) $emailContainer.classList.remove("hidden");
                // if ($welcomeMessage) $welcomeMessage.classList.remove("hidden");
                // if ($divider) $divider.classList.remove("hidden");
                // The start method will wait until the DOM is loaded.
                // ui.start('#signup-app', config);
            }


            ui.start('#signup-app', config);

        },
        destroyed() {
            if (this.memberListener) {
                this.memberListener();
            }
        },
        props: {},
        data(): {
            title: string,
            message: string | undefined,
            memberListener: ListenerUnsubscriber | undefined,
            user: FirebaseUser | undefined,
            member: CactusMember | undefined,
            authLoaded: boolean,
            loading: boolean,
            email: string,
            commonCopy: CommonCopy,
        } {
            return {
                title: copy.common.SIGN_UP,
                commonCopy: copy.common,
                message: undefined,
                user: undefined,
                member: undefined,
                authLoaded: false,
                memberListener: undefined,
                loading: false,
                email: ""
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

    .buttonContainer {
        margin: -1.6rem -24px 0;

        @include r(600) {
            margin: -1.6rem auto 0;
            max-width: 30rem;
        }
    }

    .centered {
        position: relative;
        z-index: 1;
        padding: 2.6rem;
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
