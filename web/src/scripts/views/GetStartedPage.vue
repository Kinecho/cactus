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
        <div>
            <div class="centered">
                <div class="main">
                    <template v-if="!signupLoading">
                        <h1>Let's get Started</h1>
                        <p>Your happiness is waiting</p>

                        <img src="/assets/images/albert.svg"/>

                    </template>
                    <div class="row">
                        <img src="/assets/images/thom.svg">
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
                        <img src="/assets/images/teacher.svg">
                    </div>

                    <template v-if="!signupLoading">
                        <h2>We can do wahtever we want</h2>
                        <h3>Including below or around the signup widget</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam consectetur, arcu vitae
                            accumsan lacinia, augue est tincidunt purus, nec cursus ligula nunc vitae dolor. Donec
                            lectus magna, volutpat in cursus et, volutpat at enim. Quisque in metus suscipit, aliquet
                            odio at, faucibus justo. Vestibulum dolor mi, aliquam vitae lorem sit amet, elementum
                            ultricies libero. Morbi vehicula urna id lectus venenatis, non tristique dui consequat. Duis
                            justo sapien, pellentesque id interdum sit amet, suscipit fermentum lorem. Vestibulum
                            faucibus, mauris sed sagittis pulvinar, nibh ex consectetur dui, id scelerisque enim quam
                            nec erat. Fusce nisi ante, aliquet et neque sed, congue blandit lorem. Nunc lobortis
                            convallis urna, malesuada mattis purus sollicitudin ac. Nullam iaculis ornare leo id
                            posuere. Maecenas id libero blandit, vehicula nibh eget, pretium erat. Nulla libero ipsum,
                            varius nec quam eget, condimentum sagittis ex. Aliquam pulvinar, ex ac mattis lobortis,
                            felis justo convallis sapien, sed mattis ipsum quam non quam. Aliquam ipsum sapien, volutpat
                            a aliquet sed, euismod et elit.
                        </p>
                        <p>
                            Nunc nec enim sit amet augue maximus rutrum. Proin porta sapien ac augue condimentum
                            dignissim. Fusce dignissim aliquet nibh, ac condimentum diam ultrices vitae. Sed viverra a
                            tellus eu condimentum. Nunc et viverra nulla. Maecenas sit amet massa nisl. Nulla dapibus ex
                            eu ante suscipit finibus. Ut luctus turpis et sem cursus lacinia. Sed eu lacus a orci
                            vulputate volutpat. Mauris blandit suscipit luctus. Suspendisse in efficitur purus. Integer
                            eleifend quam a mattis vehicula. Fusce fringilla dolor venenatis, malesuada sem id,
                            facilisis mauris. Fusce id porta velit, nec congue velit.
                        </p>
                        <p>
                            Quisque volutpat finibus risus, a imperdiet mi facilisis ac. In eu purus arcu. Pellentesque
                            posuere non ex ut maximus. Etiam nec odio at diam semper rutrum. Quisque commodo ut tellus
                            et lobortis. Nullam eget ultricies urna. Aenean mattis nisi id ultricies varius. Proin
                            consectetur massa faucibus dui sollicitudin, vitae rhoncus urna varius. Suspendisse sit amet
                            feugiat lectus. Vivamus sed dui eros. Integer ultricies sed nunc at imperdiet. Donec
                            suscipit convallis lectus vel scelerisque. In facilisis cursus mi, et ullamcorper metus
                            hendrerit at. Curabitur augue dolor, auctor eget pellentesque ut, sagittis nec odio. Aenean
                            eget scelerisque ante.
                        </p>
                        <p>
                            Phasellus ac egestas lacus, in gravida justo. Nulla et mattis elit. Aliquam congue sodales
                            vestibulum. Proin molestie quis neque et pellentesque. In arcu libero, viverra et tortor et,
                            bibendum consectetur elit. Nullam pretium nulla a nibh molestie vulputate. Vestibulum
                            ullamcorper ornare pulvinar. Fusce sagittis, augue at imperdiet ultrices, metus eros rutrum
                            velit, quis bibendum nibh nisi et metus. Praesent vitae tincidunt urna, at vulputate lectus.
                            Aenean euismod euismod vulputate. Class aptent taciti sociosqu ad litora torquent per
                            conubia nostra, per inceptos himenaeos.
                        </p>
                        <p>
                            Aliquam ultricies egestas tortor at pretium. Sed eu est scelerisque, mollis odio at, tempus
                            elit. Pellentesque eget nisl lectus. Curabitur rhoncus velit metus, eget lobortis dui varius
                            sit amet. Quisque lorem eros, dignissim ac quam non, semper convallis dui. Morbi tincidunt
                            egestas libero. Suspendisse potenti. Duis lobortis, augue consectetur mattis euismod, sem
                            erat tincidunt odio, quis luctus dui velit vitae leo. Vestibulum ac molestie elit.
                            Vestibulum lobortis molestie libero non hendrerit. Nam blandit gravida ipsum sit amet
                            aliquam. Morbi non mollis sem. Phasellus nec vestibulum neque. Cras eu ullamcorper tortor,
                            aliquam auctor libero.</p>
                    </template>
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

    .page {
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
                background: lighten($dolphin, 16%);
                background-image: url(/assets/images/grainy.png),
                url(/assets/images/crosses2.svg),
                url(/assets/images/outlineBlob.svg),
                url(/assets/images/royalBlob.svg),
                url(/assets/images/pinkBlob5.svg);
                background-position: 0 0,
                -1rem -1rem,
                -59rem -26rem,
                -15rem 34rem,
                70rem -70rem;
                background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;
                background-size: auto, auto, 110%, 100%, 120rem;
            }
        }

        background: lighten($dolphin, 16%);

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

    .main {
        align-items: center;
        color: $white;
        display: flex;
        min-height: 100vh;
        padding: 0 2.4rem;
        flex-direction: column;
        /*.centered {*/
        text-align: center;
        /*}*/

        /*position: relative;*/
        justify-content: center;
        z-index: 1;
        /*padding: 6.4rem 2.4rem 0;*/

        @include r(600) {
            padding: 12rem 0 0;
        }
    }

    .row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        img {
            width: 100px;

        }
    }

    .auth-widget {
        margin: 4rem;
        border: 4px solid red;
    }
</style>