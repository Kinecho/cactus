<template>
    <div>
        <hero title="Gap Onboarding Page" sub-text="Research-backed prompts to increase self-awareness and resilience">
            <router-link :to="mainCtaPath" tag="button" class="quizBtn primary">Try It Free</router-link>
        </hero>
        <why-cactus/>
        <split-view>
            <template>
                <fortify-e-q/>
                <private/>
            </template>
        </split-view>
        <testimonials/>
        <pre-footer>
            <router-link :to="mainCtaPath" tag="button" class="quizBtn primary">Try It Free</router-link>
        </pre-footer>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { isAndroidApp, isAndroidDevice, isIosDevice } from "@web/DeviceUtil";
    import AppStoreIcon from "@components/AppStoreIcon.vue";
    import PlayStoreIcon from "@components/PlayStoreIcon.vue";
    import Component from "vue-class-component";
    import { PageRoute } from "@shared/PageRoutes";
    import SignIn from "@components/SignIn.vue";
    import WhyCactus from "@components/landingPages/WhyCactus.vue";
    import FortifyEQ from "@components/landingPages/FortifyEQ.vue";
    import Private from "@components/landingPages/Private.vue";
    import Split from "@components/landingPages/Split.vue"
    import Testimonials from "@components/landingPages/Testimonials.vue";
    import PreFooter from "@components/landingPages/PreFooter.vue";
    import Hero from "@components/landingPages/Hero.vue";

    @Component({
        components: {
            Hero,
            PreFooter,
            Testimonials,
            SplitView: Split,
            Private,
            FortifyEQ,
            WhyCactus,
            SignIn,
            AppStoreIcon,
            PlayStoreIcon,
        }
    })
    export default class LandingPageOne extends Vue {
        name = "GapOnboarding.vue";

        beforeMount() {
            this.isMobileDevice = (isAndroidDevice() || isIosDevice());
            this.isAndroidApp = isAndroidApp();
        }

        isMobileDevice = false;
        isAndroidApp = false;

        get assessmentHref(): string {
            return PageRoute.GAP_ANALYSIS;
        }

        get mainCtaPath(): string {
            return PageRoute.HELLO_ONBOARDING
        }

        get showTryItHeader(): boolean {
            return this.isMobileDevice && this.isAndroidApp;
        }

    }
</script>

<style scoped lang="scss">
    @import "styles/mixins";
    @import "styles/variables";
    @import "styles/common";
    @import "styles/modal";

    .quizBtn {
        min-width: 24rem;
    }

    //.graphicContainer {
    //    align-self: end;
    //    background: url(/assets/images/demoBg.png) no-repeat center bottom -10rem/38rem;
    //    grid-area: demo;
    //    overflow: hidden;
    //    position: relative;
    //
    //    @include r(960) {
    //        background-size: 47rem;
    //    }
    //
    //    .promptDemo {
    //        background-color: $beige;
    //        border-radius: 1.2rem 1.2rem 0 0;
    //        margin: 0 auto;
    //        padding: .8rem;
    //        width: 24rem;
    //
    //        @include r(960) {
    //            padding: 1.6rem;
    //            width: 32rem;
    //        }
    //    }
    //
    //    .progressBar {
    //        background-color: $darkestGreen;
    //        border-radius: .2rem;
    //        height: .4rem;
    //        margin-bottom: 11rem;
    //        position: relative;
    //
    //        &:after {
    //            background-color: $green;
    //            border-radius: .2rem 0 0 .2rem;
    //            content: "";
    //            display: block;
    //            height: .4rem;
    //            left: 0;
    //            position: absolute;
    //            top: 0;
    //            width: 20%;
    //        }
    //    }
    //
    //    .demoCactus {
    //        display: block;
    //        height: 5.6rem;
    //        margin: 0 auto;
    //        width: 5.6rem;
    //    }
    //
    //    .demoTheme {
    //        letter-spacing: 1px;
    //        margin-bottom: .8rem;
    //        text-transform: uppercase;
    //    }
    //
    //    .demoText {
    //        margin-bottom: 11rem;
    //        padding: 0 1.6rem;
    //    }
    //
    //    .sampleQuestion {
    //        @include shadowbox;
    //        font-size: 1.6rem;
    //        font-weight: bold;
    //        padding: .8rem 1.6rem;
    //        position: absolute;
    //        text-align: left;
    //        width: 20rem;
    //
    //        &:nth-child(1) {
    //            right: 1.6rem;
    //            top: 3.2rem;
    //
    //            @include r(960) {
    //                top: 4.8rem;
    //            }
    //        }
    //
    //        &:nth-child(2) {
    //            bottom: 3.2rem;
    //            left: 1.6rem;
    //        }
    //    }
    //}


    //    .split {
    //        @include r(768) {
    //            display: flex;
    //            max-width: none;
    //
    //            .private,
    //            .fortify {
    //                flex-basis: 50%;
    //            }
    //        }
    //
    //        .subtext {
    //            margin: 0 auto 2.4rem;
    //            max-width: 40rem;
    //            text-align: center;
    //
    //            @include r(768) {
    //                margin-bottom: 5.6rem;
    //            }
    //        }
    //    }
</style>
