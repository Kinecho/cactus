<template>
    <div class="page-wrapper">
        <div class="signin-wrapper">
            <div class="centered">
                <SignIn :message="message"
                        :title="title"
                        :twitter-enabled="includeTwitter"
                        :mode="isSignUp ? 'SIGN_UP' : 'LOG_IN'"
                />
            </div>
        </div>
        <StandardFooter :isTransparent="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import SignIn from "@components/SignIn.vue";
    import { PageRoute } from "@shared/PageRoutes";
    import CopyService from "@shared/copy/CopyService";
    import { LocalizedCopy } from "@shared/copy/CopyTypes";
    import StandardFooter from "@components/StandardFooter.vue";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import Logger from "@shared/Logger"
    import Component from "vue-class-component";

    const logger = new Logger("SignUpView");

    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            SignIn,
            StandardFooter,
        }
    })
    export default class SignUpView extends Vue {

        beforeMount(): void {
            document.body.classList.add("sign-up-body");
        }

        mounted(): void {
            document.body.classList.add("sign-up-body");
        }

        beforeDestroy(): void {
            // document.body.classList.remove("sign-up-body");
        }

        destroyed(): void {
            document.body.classList.remove("sign-up-body");
        }

        get copy(): LocalizedCopy {
            return copy;
        }

        get message(): string | null {
            const message = getQueryParam(QueryParam.MESSAGE) ?? this.$route.query.message as string;
            logger.info("message is", message);
            return message;
        }

        get includeTwitter(): boolean {
            //only show twitter on login screen, not sign up
            return this.isLogIn;
        }

        get title(): string {
            return this.isLogIn ? copy.common.LOG_IN : copy.common.SIGN_UP;
        }

        get isSignUp(): boolean {
            return this.$route.path === PageRoute.SIGNUP;
        }

        get isLogIn(): boolean {
            return this.$route.path === PageRoute.LOGIN;
        }

        name = "SignUpView";
    }
</script>

<style lang="scss">
    @import "mixins";

    body.sign-up-body {
        @include blueWavyBackground;
        min-height: 100vh;
    }
</style>

<style lang="scss">
    @import "variables";
    @import "common";
    @import "forms";
    @import "modal.scss";

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
            //color: $white;
        }

        .firebaseui-link {
            //text-decoration: underline;
        }
    }

</style>

<style scoped lang="scss">
    @import "mixins";

    .centered {
        position: relative;
        z-index: 1;
        padding: 6.4rem 2.4rem 0;

        @include r(600) {
            padding: 12rem 0 0;
        }
    }

</style>