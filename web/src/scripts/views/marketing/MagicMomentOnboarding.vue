<template>
    <div>
        <div class="centered">
            <section class="hero">
                <div class="heroText">
                    <h1>Boost your mental&nbsp;fitness</h1>
                    <p class="subtext">Research-backed prompts to increase self-awareness and resilience</p>
                    <router-link :to="mainCtaPath" tag="button" class="quizBtn primary">Try It Free</router-link>
                </div>
                <aside class="graphicContainer">
                    <p class="sampleQuestion">What helps you unwind and recuperate?</p>
                    <p class="sampleQuestion">When did you first fall in love?</p>
                    <div class="promptDemo">
                        <div class="progressBar"></div>
                        <img class="demoCactus" src="/assets/images/elements/experience.svg" alt="Meaning cactus icon"/>
                        <h4 class="demoTheme">Experience</h4>
                        <p class="demoText">Today you’ll reflect on your favorite thing to do on a sunny&nbsp;day.</p>
                    </div>
                </aside>
            </section>
        </div>
        <section class="why">
            <div class="centered">
                <h2>Proven to make you&nbsp;smile</h2>
                <p class="subtext">Cactus provides a minute of mindfulness via guided&nbsp;reflection.</p>
                <div class="flexContainer">
                    <div class="benefit">
                        <img src="/assets/images/benefit1.png" alt="Focus image" class="illustration"/>
                        <h5>Focus</h5>
                        <p class="text">A daily question helps you focus on the positives in your&nbsp;life.</p>
                    </div>
                    <div class="benefit">
                        <img src="/assets/images/benefit2.png" alt="Self-discovery image" class="illustration"/>
                        <h5>Self-Discovery</h5>
                        <p class="text">Exercises are designed to help your journey of&nbsp;self-discovery.</p>
                    </div>
                    <div class="benefit">
                        <img src="/assets/images/benefit3.png" alt="Privacy image" class="illustration"/>
                        <h5>Privacy</h5>
                        <p class="text">Privately record your thoughts through text, speech, and&nbsp;photos.</p>
                    </div>
                    <div class="benefit">
                        <img src="/assets/images/benefit4.png" alt="Growth image" class="illustration"/>
                        <h5>Growth</h5>
                        <p class="text">Celebrate your mindful practice and personal&nbsp;growth.</p>
                    </div>
                </div>
            </div>
        </section>
        <div class="split">
            <section class="fortify">
                <h2>Fortify your EQ</h2>
                <p class="subtext">Cactus helps make you more optimistic, generous to yourself and others,
                    and&nbsp;healthier.</p>
                <img src="/assets/images/fortify.png" alt="Fortify image" class="sectionImg"/>
            </section>
            <section class="private">
                <h2 class="magenta">Private and secure</h2>
                <p class="subtext">Your Cactus reflections are transmitted and stored using
                    <em>256-bit&nbsp;encryption</em>.
                </p>
                <div class="reflection">
                    <div class="flexContainer">
                        <p class="date">Nov 12, 2019</p>
                        <button class="secondary icon" aria-label="Unclickable Option Menu">
                            <img src="/assets/images/dots.svg" alt="" class="iconImg"/></button>
                    </div>
                    <p class="question">What experiences or activities make you lose track of&nbsp;time?</p>
                    <div class="reply"></div>
                </div>
            </section>
        </div>
        <section class="testimonials list">
            <div class="centered">
                <h2>What people are saying</h2>
                <p class="subtext">The Cactus community reflect on their&nbsp;experiences</p>
                <div class="flexContainer">
                    <div class="quote">
                        <div class="avatar">
                            <img class="avatarImg" src="/assets/images/avatars/testimonialAvatar3.png" alt="Samantha"/>
                            <p class="name">Samantha W</p>
                        </div>
                        <p class="quoteText">“I needed motivation and guidance to think about what I want in life.
                            Cactus
                            reinforces positive thinking and <strong>keeps me accountable</strong> to reflect on what
                            brings me
                            joy.”</p>
                    </div>
                    <div class="quote">
                        <div class="avatar">
                            <img class="avatarImg" src="/assets/images/avatars/testimonialAvatar1.png" alt="Thom"/>
                            <p class="name">Thom M</p>
                        </div>
                        <p class="quoteText">“I was hoping to practice daily gratitude, but I needed a little help
                            getting
                            started. Cactus provided an opportunity to <strong>reflect in an approachable way</strong>,
                            and I
                            find myself in higher spirits after using it.”</p>
                    </div>
                    <div class="quote">
                        <div class="avatar">
                            <img class="avatarImg" src="/assets/images/avatars/testimonialAvatar2.png" alt="Mike P"/>
                            <p class="name">Mike P</p>
                        </div>
                        <p class="quoteText">“I wanted to try a <strong>different kind of mindfulness</strong>. Cactus
                            is
                            surprisingly enjoyable and helped me find clarity, and now I’m more open to consider new
                            things.”
                        </p>
                    </div>
                    <div class="quote">
                        <div class="avatar">
                            <img class="avatarImg" src="/assets/images/avatars/testimonialAvatar4.png" alt="Nicole"/>
                            <p class="name">Nicole P</p>
                        </div>
                        <p class="quoteText">“First thing in the morning, in the midst of checking work emails and
                            feeling the
                            anxiety of the day creep, the Cactus emails <strong>help me pause</strong>, reset my
                            attitude, and
                            begin the day on a positive note before I even get out of bed.”</p>
                    </div>
                </div>
            </div>
        </section>
        <div class="centered">
            <section class="email">
                <h2 class="emailHeader">A reflection a day…</h2>
                <p class="subtext">Cactus is a different kind of mindfulness.</p>
                <router-link :to="mainCtaPath" tag="button" class="quizBtn primary">Try It Free</router-link>
            </section>
        </div>
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
    @Component({
        components: {
            SignIn,
            AppStoreIcon,
            PlayStoreIcon,
        }
    })
    export default class MarketingHome extends Vue {
        name = "MagicMomentOnboarding.vue";

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

    //This is the target for the sign-up jump button
    #sign-up {
        position: relative;
        top: -6rem;
        height: 0;
        width: 100%;
        grid-area: target;
    }

    .subtext {
        opacity: .8;

        @include r(960) {
            font-size: 2rem;
        }
    }

    .hero {
        display: grid;
        grid-template-areas: "heroText" "demo" "target" "form";
        grid-template-rows: auto;
        margin: 2.4rem auto 0;
        max-width: 50rem;
        position: relative;

        @include r(768) {
            grid-template-columns: 50% auto;
            grid-template-rows: auto auto;
            grid-template-areas: "heroText demo" "form demo";
            margin-top: 4.8rem;
            max-width: none;
            padding: 0 1.6rem;
        }
        @include r(1024) {
            grid-template-columns: 53% auto;
            grid-template-rows: auto auto;
        }
        @include r(1200) {
            padding: 0;
        }

        .heroText {
            align-self: end;
            grid-area: heroText;
            margin: 0 auto 4.8rem;
            max-width: 60rem;

            @include r(768) {
                margin: 0;
                text-align: left;
            }
            @include r(1140) {
                padding-top: 8rem;
            }

            .app-icons {
                display: flex;
                justify-content: center;
            }

            #tryItHeader {
                margin-top: 2.4rem;

                &.hide {
                    display: none;
                }

                @include r(768) {
                    display: none;
                }
            }

            .app-store-icon,
            .play-store-icon {
                margin-top: 1.6rem;
            }
        }

        h1 {
            line-height: 1.2;
            margin: .8rem 2.4rem;

            @include r(768) {
                margin: 0 2.4rem .8rem 0;
                max-width: 65rem;
            }
        }

        .subtext {
            margin: 0 2.4rem 2.4rem;
            max-width: 44rem;

            @include r(768) {
                margin: 0 2.4rem 3.2rem 0;
                max-width: 48rem;
            }
        }

        .heroForm {
            display: none;

            @include r(768) {
                align-self: start;
                background-color: transparent;
                display: block;
                grid-area: form;
                justify-content: flex-start;
                max-width: 70rem;
                padding: 0 2.4rem 4.4rem 0;
                text-align: left;
                z-index: 2;
            }
            @include r(1140) {
                padding-bottom: 14rem;
            }

            input[type=email],
            button {
                @include r(768) {
                    display: inline;
                    margin-bottom: 1.6rem;
                }
                @include r(1024) {
                    margin-bottom: 0;
                }
            }

            .app-icons {
                display: flex;
                margin-top: 2.4rem;
            }
        }
    }

    #signupAnchor {
        left: 0;
        position: absolute;
        top: 32rem;
    }

    .quizBtn {
        min-width: 24rem;
    }

    .graphicContainer {
        align-self: end;
        background: url(/assets/images/demoBg.png) no-repeat center bottom -10rem/38rem;
        grid-area: demo;
        overflow: hidden;
        position: relative;

        @include r(960) {
            background-size: 47rem;
        }

        .promptDemo {
            background-color: $beige;
            border-radius: 1.2rem 1.2rem 0 0;
            margin: 0 auto;
            padding: .8rem;
            width: 24rem;

            @include r(960) {
                padding: 1.6rem;
                width: 32rem;
            }
        }

        .progressBar {
            background-color: $darkestGreen;
            border-radius: .2rem;
            height: .4rem;
            margin-bottom: 11rem;
            position: relative;

            &:after {
                background-color: $green;
                border-radius: .2rem 0 0 .2rem;
                content: "";
                display: block;
                height: .4rem;
                left: 0;
                position: absolute;
                top: 0;
                width: 20%;
            }
        }

        .demoCactus {
            display: block;
            height: 5.6rem;
            margin: 0 auto;
            width: 5.6rem;
        }

        .demoTheme {
            letter-spacing: 1px;
            margin-bottom: .8rem;
            text-transform: uppercase;
        }

        .demoText {
            margin-bottom: 11rem;
            padding: 0 1.6rem;
        }

        .sampleQuestion {
            @include shadowbox;
            font-size: 1.6rem;
            font-weight: bold;
            padding: .8rem 1.6rem;
            position: absolute;
            text-align: left;
            width: 20rem;

            &:nth-child(1) {
                right: 1.6rem;
                top: 3.2rem;

                @include r(960) {
                    top: 4.8rem;
                }
            }

            &:nth-child(2) {
                bottom: 3.2rem;
                left: 1.6rem;
            }
        }
    }

    .why {
        background-color: $darkestGreen;
        padding: 4.8rem 2.4rem;
        position: relative;

        @include r(768) {
            padding: 9rem 2.4rem 11rem;
        }

        h2 {
            color: $white;
        }

        .subtext {
            color: $white;
            padding-bottom: 5.6rem;

            @include r(768) {
                padding-bottom: 7.2rem;
            }
        }

        .flexContainer {
            @include r(600) {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-around;
            }
            @include r(960) {
                flex-wrap: nowrap;
                justify-content: center;
            }
        }

        .benefit {
            padding-bottom: 5.6rem;

            @include r(600) {
                flex-basis: 50%;
            }
            @include r(960) {
                flex-basis: 25%;
                padding-bottom: 0;
                text-align: left;
            }

            &:last-child {
                padding-bottom: 0;
            }

            .text {
                color: $white;
                margin: 0 auto;
                max-width: 25rem;
                opacity: .8;

                @include r(960) {
                    margin: 0;
                    padding-right: 2.4rem;
                }
            }
        }

        .illustration {
            margin-bottom: 1.6rem;
            height: 11rem;
            width: auto;

            @include r(960) {
                height: 16rem;
            }
        }

        h5 {
            color: $white;
            font-size: 2rem;
            margin: 0 0 .8rem;
        }
    }

    .fortify {
        align-items: center;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 4.8rem 2.4rem;

        @include r(768) {
            padding: 11rem 2.4rem;
        }

        .sectionImg {
            margin-left: 1.6rem;
            width: 40rem;
        }
    }

    .split {
        @include r(768) {
            display: flex;
            max-width: none;

            .private,
            .fortify {
                flex-basis: 50%;
            }
        }

        .subtext {
            margin: 0 auto 2.4rem;
            max-width: 40rem;
            text-align: center;

            @include r(768) {
                margin-bottom: 5.6rem;
            }
        }
    }

    section.private {
        align-items: center;
        background: $beige url(/assets/images/pinkBlobNeedleBg.png) no-repeat center top 16rem/36rem;
        display: flex;
        flex-direction: column;
        padding: 4.8rem 2.4rem 8rem;
        position: relative;
        z-index: 0;

        @include r(768) {
            background-position: center top 27rem;
            background-size: 44rem;
            padding: 11rem 2.4rem;
        }

        .magenta {
            color: $magenta;
        }

        em {
            background: linear-gradient(rgba(101, 144, 237, 0.6), rgba(101, 144, 237, 0.6)) 0 90%/100% 0.8rem no-repeat;
            font-style: normal;
            padding: .2rem;
        }

        .reflection {
            @include shadowbox;
            padding: 2.4rem;
            position: relative;
            text-align: left;

            @include r(768) {
                margin-top: 4rem;
                max-width: 48rem;
            }

            .flexContainer {
                align-items: center;
                display: flex;
                justify-content: space-between;
                margin-bottom: 1.6rem;
            }

            .date {
                font-size: 1.6rem;
                opacity: .8;
            }

            button {
                border: 0;
                cursor: default;
                flex-grow: 0;
                padding: 0;

                img {
                    height: 2.4rem;
                    width: 2.4rem;
                }
            }

            .question {
                font-weight: bold;
                margin-bottom: .8rem;
            }
        }

        .reply {
            background-color: $lightestGreen;
            border-radius: .4rem;
            height: 1.8rem;
            margin: 3.6rem 0 2.4rem;
            position: relative;

            &:before,
            &:after {
                background-color: $lightestGreen;
                border-radius: .4rem;
                content: "";
                height: 1.8rem;
                left: 0;
                position: absolute;
            }

            &:before {
                top: -2.4rem;
                width: 90%;
            }

            &:after {
                bottom: -2.4rem;
                width: 30%;
            }
        }
    }

    .testimonials {
        background-image: linear-gradient(180deg, #F8F6F5 0%, $white 20%);
        padding: 4.8rem 0 0;

        @include r(768) {
            padding: 11rem 0 0;
        }

        .subtext {
            padding: 0 2.4rem 2.4rem;

            @include r(768) {
                padding-bottom: 4rem;
            }
        }

        .flexContainer {
            display: flex;
            margin: 0;
            -webkit-overflow-scrolling: touch;
            overflow-x: auto;
            padding: 0 2.4rem 4.8rem;
            scroll-snap-type: x mandatory;

            @include r(768) {
                flex-flow: row wrap;
                justify-content: center;
            }
        }

        .quote {
            @include shadowbox;
            align-items: flex-start;
            margin: 0 1.6rem 0 0;
            min-width: 84vw;
            padding: 2.4rem;
            scroll-snap-align: center;
            text-align: left;

            @include r(600) {
                flex-basis: 44%;
                margin-bottom: 3.2rem;
                max-width: 45rem;
                min-width: 32rem;
                padding: 3.2rem;
            }
            @include r(1024) {
                margin: 0 2vw 6.4rem;
            }
        }

        .avatar {
            margin-bottom: 1.6rem;
            text-align: center;
        }

        .avatarImg {
            height: 8rem;
        }

        .name {
            font-size: 1.6rem;
            margin: 0;
            opacity: .5;
        }

        .quoteText {
            margin: 0;
        }
    }

    section.email {
        background-color: $beige;
        padding: 5.6rem 0;
        position: relative;
        z-index: 1;

        .emailHeader {
            color: $magenta;
            padding: 0 2.4rem;
        }

        .subtext {
            margin: 0 0 2.4rem;
            padding: 0 2.4rem;
        }

        .lowerForm {
            display: flex;
            flex-flow: column wrap;
            padding: 0 2.4rem 4rem;

            @include r(600) {
                flex-direction: row;
                padding: 0 2.4rem 5.6rem;
            }
            @include r(768) {
                justify-content: center;
            }
        }
    }


    /*
        / \
       |v  |
     _ |  v|
    / ||v  |  _.
    |v||  v|/_/
    | ||v  | _
    |v||  v|| \
     \||v  ||v |
       |  v||  |
       |v  ||v |
       |  v||  |
       |v  ||v |
       |  v||_/
       |v  |
       \   |
        \__|
    */

</style>
