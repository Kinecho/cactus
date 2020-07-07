<template>
    <div class="centered pageContainer" id="page-container">
        <header>
            <a href="/"><img class="logo" src="/assets/images/logoWhite.svg" alt="Cactus logo"/></a>
        </header>
        <section id="loading-container" class="loading" v-if="!authLoaded">
            <h2><span class="loading"><img src="/assets/images/loading-white.svg" alt=""/></span>Signing In...</h2>
        </section>
        <section id="success-container" class="hidden">
            <img class="graphic" src="/assets/images/smiling.png" alt=""/>
            <h1 id="message">Subscription Confirmed</h1>
            <p id="content">You’re on your way to a happier, healthier mindset. Help us spread the word:</p>
            <div class="sharethis-inline-share-buttons" data-url="https://cactus.app/?utm_source=ShareThis" data-message="Join me in developing a happier, healthier mindset with https://cactus.app" data-title="The simplest way to change your reality is to change what you focus on. See yourself and the world more positively with Cactus."></div>
        </section>
        <section class="hidden" id="error-container">
            <h1 class="title">Uh oh!</h1>
            <p class="message">We were unable to confirm your subscription</p>
        </section>
        <section id="continue-container" class="hidden">
            <a href="#" class="button">Continue</a>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { FirebaseUser, getAuth } from "@web/firebase";
    import { handleEmailLinkSignIn } from "@web/authUi";
    import Logger from "@shared/Logger";
    import { EmailLinkSignupResult, sendLoginEvent } from "@web/auth";
    import { LocalStorageKey } from "@web/services/StorageService";
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import { appendQueryParams, isFeatureAuthUrl } from "@shared/util/StringUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import { pushRoute } from "@web/NavigationUtil";

    const logger = new Logger("SignupConfirmed");
    export default Vue.extend({
        name: "SignupConfirmed",
        beforeMount(): void {
            document.body.classList.add("simplyCentered");
            this.authListener = getAuth().onAuthStateChanged(async (user) => {
                this.user = user;
                // if (!this.authLoaded) {
                //     const response = handleEmailLinkSignIn();
                // }
                // this.authLoaded = true;
                //

                logger.log("auth state changed. Has Loaded = ", this.authLoaded, " User = ", user);
                if (!this.authLoaded && !user) {
                    logger.log("not logged in and this is the first time. handling email link...");
                    const response = await handleEmailLinkSignIn();
                    await this.handleResponse(response);
                } else if (!this.authLoaded && user) {
                    logger.log("user is signed in, and the page has not yet loaded auth");
                    await this.handleExistingUserLoginSuccess(user);
                } else {
                    logger.log("auth changed, probably has loaded before. Has loaded =", this.authLoaded);
                }
                this.authLoaded = true;
            })
        },
        beforeDestroy() {
            document.body.classList.remove("simplyCentered");
        },
        data(): {
            authLoaded: boolean,
            authListener: any,
            user: FirebaseUser | null,
        } {
            return {
                authLoaded: false,
                authListener: undefined,
                user: null,
            }
        },
        methods: {
            async handleExistingUserLoginSuccess(user: FirebaseUser): Promise<void> {
                logger.log("redirecting...");

                await sendLoginEvent({ user });

                const member: CactusMember | undefined = CactusMemberService.sharedInstance.currentMember;
                let redirectUrl = getQueryParam(QueryParam.REDIRECT_URL);

                if (member?.id && redirectUrl && isFeatureAuthUrl(redirectUrl)) {
                    redirectUrl = appendQueryParams(redirectUrl, { memberId: member.id });
                }

                await pushRoute(redirectUrl || PageRoute.MEMBER_HOME);
            },
            async handleResponse(response: EmailLinkSignupResult) {
                if (response.credential) {
                    try {
                        if (response.credential.additionalUserInfo && response.credential.additionalUserInfo.isNewUser) {
                            localStorage.setItem(LocalStorageKey.newUserSignIn, response.credential.user ? response.credential.user.uid : "true");
                        } else {
                            localStorage.removeItem(LocalStorageKey.newUserSignIn);
                        }
                    } catch (e) {
                        logger.error("unable to persist new user status to localstorage");
                    } finally {
                        await sendLoginEvent(response.credential);

                        const member: CactusMember | undefined = CactusMemberService.sharedInstance.currentMember;
                        let redirectUrl = getQueryParam(QueryParam.REDIRECT_URL);

                        if (member?.id && redirectUrl && isFeatureAuthUrl(redirectUrl)) {
                            redirectUrl = appendQueryParams(redirectUrl, { memberId: member.id });
                        }

                        await pushRoute(redirectUrl || PageRoute.MEMBER_HOME);
                    }

                    return;
                }


                const $success = document.getElementById("success-container");
                const $error = document.getElementById("error-container");
                const $loading = document.getElementById("loading-container");
                const $continueContainer = document.getElementById("continue-container");

                if ($loading) $loading.classList.add("hidden");
                if (response.success) {
                    if ($success) $success.classList.remove("hidden");
                    // showShareButtons();
                } else if (response.error && $error) {
                    $error.classList.remove("hidden");
                    // document.getE
                    if (response.error) {
                        const $title = $error.getElementsByClassName("title").item(0);
                        const $message = $error.getElementsByClassName("message").item(0);
                        if ($title) $title.textContent = response.error.title;
                        if ($message) $message.textContent = response.error.message;
                    }
                }

                if (response.continue && $continueContainer) {
                    const $button = $continueContainer.getElementsByTagName("a").item(0);
                    if ($button) {
                        $button.text = response.continue.title;
                        $button.href = response.continue.url;
                    }
                    $continueContainer.classList.remove("hidden")
                } else if ($continueContainer) {
                    $continueContainer.classList.add("hidden")
                }
            }
        }
    })
</script>

<style lang="scss">
    @import "simplyCentered";
</style>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";

    @keyframes fadein {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    #loading-container {
        animation: 2s ease 0s normal forwards 1 fadein;

        img {
            animation: rotate 1s linear infinite;
            height: 2rem;
            margin: 0 .8rem .4rem 0;
            transform-origin: center;
            vertical-align: middle;
            width: 2rem;
        }
    }

    header {
        border: 0;
    }

    .pageContainer {
        align-items: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 100vh;
    }

</style>