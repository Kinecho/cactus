<template>
    <div class="page-wrapper">
        <div class="signin-wrapper">
            <NavBar :showLinks="false" v-bind:showSignup="false" :showLogin="false" v-bind:redirectOnSignOut="false" :isSticky="false" :forceTransparent="true" :largeLogoOnDesktop="true" :whiteLogo="true"/>
            <SignIn :message="message" :title="title"/>
        </div>
        <Footer :isTransparent="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import SignIn from "@components/SignIn.vue";

    export default Vue.extend({
        components: {
            NavBar,
            SignIn,
        },
        name: "SignUpView"
    })
</script>


<style lang="scss">
    @import "~styles/mixins";
    @import "~styles/variables";
    @import "~styles/common";
    @import "~styles/modal";

    /*body.sign-up-body {*/
    body {
        @include blueWavyBackground;
        min-height: 100vh;
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


<style scoped lang="scss">

</style>