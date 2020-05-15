<template>
    <div class="page-wrapper">
        <div class="signin-wrapper">
            <NavBar :showLinks="false"
                    :showSignup="false"
                    :showLogin="false"
                    :redirectOnSignOut="false"
                    :isSticky="false"
                    :forceTransparent="true"
                    :largeLogoOnDesktop="true"
                    :whiteLogo="true"/>
            <SignIn :message="message" :title="title" :twitter-enabled="includeTwitter"/>

            <div class="switcher">
                <p v-if="isLogIn">
                    Don't have an account?
                    <router-link :to="signUpPath">Sign up</router-link>
                    .
                </p>
                <p v-if="isSignUp">
                    Already have an account?
                    <router-link :to="loginPath">Log in</router-link>
                    .
                </p>
            </div>


        </div>
        <StandardFooter :isTransparent="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import SignIn from "@components/SignIn.vue";
    import { PageRoute } from "@shared/PageRoutes";
    import CopyService from "@shared/copy/CopyService";
    import { LocalizedCopy } from "@shared/copy/CopyTypes";
    import StandardFooter from "@components/StandardFooter.vue";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            NavBar,
            SignIn,
            StandardFooter,
        },
        beforeMount(): void {
            document.body.classList.add("sign-up-body");
        },
        mounted(): void {
            document.body.classList.add("sign-up-body");
        },
        beforeDestroy(): void {
            document.body.classList.remove("sign-up-body");
        },
        destroyed(): void {
            document.body.classList.remove("sign-up-body");
        },
        data(): { copy: LocalizedCopy, message: string | null } {
            return {
                copy,
                message: getQueryParam(QueryParam.MESSAGE),
            }
        },
        computed: {
            loginPath(): string {
                return PageRoute.LOGIN;
            },
            signUpPath(): string {
                return PageRoute.SIGNUP;
            },
            includeTwitter(): boolean {
                //only show twitter on login screen, not sign up
                return this.isLogIn;
            },
            title(): string {
                return this.isLogIn ? copy.common.LOG_IN : copy.common.SIGN_UP;
            },
            isSignUp(): boolean {
                return this.$route.path === PageRoute.SIGNUP;
            },
            isLogIn(): boolean {
                return this.$route.path === PageRoute.LOGIN;
            }
        },
        name: "SignUpView"
    })
</script>

<style lang="scss">
    @import "mixins";

    body.sign-up-body {
        @include blueWavyBackground;
        min-height: 100vh;
    }
</style>

<style lang="scss">
    @import "common";
    @import "variables";
    @import "~styles/modal.scss";
    @import "~styles/forms.scss";

    .switcher {
        text-align: center;
        margin-top: 5rem;
    }

    .page-wrapper {
        position: relative;

        header {
            position: relative;
            z-index: 2;

            .centered {
                justify-content: center;
            }

            .nav-logo {
                height: 5.8rem;
                width: 11.7rem;
            }
        }

        .signin-wrapper {
            color: $white;
            flex-grow: 1;
            overflow: hidden;
            margin: 0 auto 4rem;
            min-height: calc(100vh - 30rem);
            padding-top: 4.8rem;
            position: relative;
            z-index: 2;

            @include r(600) {
                min-height: calc(100vh - 19rem);
            }
        }

        .firebaseui-tos,
        .firebaseui-link {
            color: $white;
        }

        .firebaseui-link {
            text-decoration: underline;
        }
    }

</style>