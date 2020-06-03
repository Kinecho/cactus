<template>
    <div class="page">
        <NavBar class="nav-bar" :showLinks="false"
                :showSignup="false"
                :showLogin="false"
                :redirectOnSignOut="false"
                :isSticky="false"
                :forceTransparent="true"
                :largeLogoOnDesktop="true"
                :whiteLogo="true"/>
        <div class="centered">
            <div class="main">
                <template v-if="!signupLoading">
                    <h1>Sign in to get started</h1>
                </template>
                <div class="auth-widget">
                    <sign-in
                            spinner-color="light"
                            mode="SIGN_UP"
                            :twitter-enabled="false"
                            :show-magic-link="false"
                            :show-title="false"
                            switcher-link-style="light"
                            @loading="onSignupLoading"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import SignIn from "@components/SignIn.vue";
    import NavBar from "@components/NavBar.vue";

    @Component({
        components: {
            SignIn,
            NavBar,
        }
    })
    export default class GetStartedPage extends Vue {
        name = "GetStartedPage";

        signupLoading: boolean = false;

        onSignupLoading(loading: boolean) {
            this.signupLoading = loading;
        }
    }
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";

    header {
        position: absolute;
        width: 100%;
    }

    .page {
        background: lighten($dolphin, 16%) url(/assets/images/grainy.png);
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;
        position: relative;

        .nav-bar {
            z-index: 2;
        }

        &:after {
            background-image: url(/assets/images/crosses2.svg),
            url(/assets/images/outlineBlob.svg),
            url(/assets/images/royalBlob.svg),
            url(/assets/images/pinkBlob5.svg);
            background-position: -11rem 38rem, right -11rem top -35rem, -21rem 41rem, 50% -143px;
            background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
            background-size: 20rem, 48rem, 30rem, 23rem;
            content: "";
            display: block;
            height: 100%;
            left: 0;
            overflow: hidden;
            position: absolute;
            top: 0;
            width: 100%;

            @include r(768) {
                background-position: -1rem -1rem,
                -59rem -26rem,
                -15rem 34rem,
                70rem -70rem;
                background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
                background-size: auto, 110%, 100%, 120rem;
            }
        }

        .centered {
            flex-grow: 1;
            max-width: 768px;
            padding: 0;
            position: relative;
            text-align: left;
            width: 100%;
            z-index: 1;
        }
    }

    .subtext {
        opacity: .8;

        @include r(768) {
            font-size: 2rem;
        }
    }

    .main {
        align-items: center;
        color: $white;
        display: flex;
        min-height: 100vh;
        padding: 0 2.4rem;
        flex-direction: column;
        text-align: center;
        justify-content: center;
        z-index: 1;
    }

    .auth-widget {
        margin-top: 4rem;
    }
</style>
