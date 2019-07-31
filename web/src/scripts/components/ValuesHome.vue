<template>
    <div>
        <div class="">
            <section class="hero">
                <div class="nav-wrapper">
                    <NavBar v-bind:isSticky="false"/>
                </div>
                <div class="copy">
                    <h4>Cactus presents</h4>
                    <h1>Your Core Values</h1>
                    <p class="subtext">Discover what values are most important to you and make better decisions for your
                        future happiness.</p>
                    <div class="cta">
                        <!--Start Survey Button Logic (logged in state)-->
                        <div v-bind:class="['wrapper', {loading: loading}]">
                            <div class="container logged-in" v-show="member && !loading">
                                <a class="button" v-show="surveyLink" v-bind:href="surveyLink">Take the Survey</a>
                            </div>
                            <div class="container logged-out" v-show="!member && !loading">
                                <AuthButton linkText="Sign in to Continue" linkUrl="/values" variant="button"></AuthButton>
                            </div>
                        </div>
                        <!--END: Start Survey Button Logic (logged in sate)-->
                    </div>
                </div>
                <img id="yellowBlob1" src="assets/images/yellowBlob.svg" alt=""/>
                <img id="greenBlob" src="assets/images/lightGreenBlob.svg" alt=""/>
                <img id="pinkBlob" src="assets/images/pinkBlob3.svg" alt=""/>
                <img id="stem" src="assets/images/stem3.svg" alt=""/>
            </section>
            <section class="threeUp list">
                <div class="centered">
                    <h2 class="listHeader">How It Works</h2>
                    <p class="subtext">Discover your core values in three easy steps</p>
                    <div class="flexContainer">
                        <div class="benefit">
                            <img src="/assets/images/valuesSelect.svg" alt="Selecting values" class="illustration"/>
                            <p class="text">Identify the values important to you and that you want to improve</p>
                        </div>
                        <div class="benefit friends">
                            <img src="/assets/images/valuesVote.svg" alt="Values voted by friends" class="illustration"/>
                            <p class="text">Send to the people who know you best to better understand what they value in
                                you</p>
                        </div>
                        <div class="benefit">
                            <img src="assets/images/cactusPots.svg" alt="Three cacti in pots" class="illustration"/>
                            <p class="text">Use your values to better understand yourself and live a happier, healthier
                                life</p>
                        </div>
                    </div>
                </div>
            </section>
            <section class="twoUp pink">
                <div class="centered">
                    <img class="graphic flip" src="assets/images/relax2.svg" alt=""/>
                    <div class="text">
                        <h2>What is most important  for&nbsp;you?</h2>
                        <p>Knowing your core values will help you achieve a higher level of self-awareness. You’ll start
                            to understand past decisions and make better decisions for your happiness in the future.</p>
                    </div>
                </div>
            </section>
            <section class="twoUp screenshot noPaddingBtm">
                <div class="centered">
                    <div class="text">
                        <h2>Your daily Cactus starts to  get personal</h2>
                        <p>Your core values results will help guide your future Cactus reflections and prompts.</p>
                    </div>
                    <div class="cropped">
                        <img class="graphic" src="assets/images/personalJournal.png" alt="Personalized question in a journal"/>
                    </div>
                </div>
            </section>
            <section class="twoUp green">
                <div class="centered">
                    <img class="graphic" src="assets/images/pizza2.svg" alt=""/>
                    <div class="text">
                        <h2>The best feedback, from those who know you&nbsp;best</h2>
                        <p>Getting feedback from others is a great way to fortify the strengths you see in yourself and
                            to discover the strengths in you that you don't see. </p>
                    </div>
                </div>
            </section>

        </div>


        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Footer from "@components/StardardFooter.vue"
    import NavBar from "@components/NavBar.vue"
    import AuthButton from "@components/AuthButton.vue"
    import {getQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from "@shared/models/CactusMember"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    // @ts-ignore
    import * as ScrollMagic from "scrollmagic";
    import {TweenMax, Power1} from "gsap";
    import 'animation.gsap';
    // @ts-ignore
    import {ScrollToPlugin} from 'gsap/all';


    const plugins = [ScrollToPlugin, TweenMax, Power1];
    console.debug("Logging so plugins dont get treek-shook :( ", plugins);

    // let emailParam = getQueryParam(QueryParam.EMAIL) || getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);

    // if (!emailParam) {
    //
    // }

    export default Vue.extend({
        components: {
            Footer: Footer,
            NavBar: NavBar,
            AuthButton: AuthButton,
        },
        created() {
            // let body = document.getElementsByTagName("body").item(0);
            // if (body){
            //     body.style.removeProperty("display");
            // }
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member, user}) => {
                    console.log("Got member");
                    this.authLoaded = true;
                    this.member = member;
                    this.email = member ? member.email : undefined;
                }
            })
        },

        mounted() {
            this.configureAnimations();
        },
        destroyed() {
            if (this.memberUnsubscriber) {
                this.memberUnsubscriber()
            }
        },
        data(): {
            member?: CactusMember,
            email?: string | null | undefined,
            authLoaded: boolean,
            memberUnsubscriber?: ListenerUnsubscriber
        } {
            return {
                email: getQueryParam(QueryParam.EMAIL) || getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS),
                member: undefined,
                authLoaded: false,
                memberUnsubscriber: undefined,
            }
        },
        computed: {
            surveyLink(): string | undefined {
                if (this.email) {
                    return `https://www.surveymonkey.com/r/cactus-core-values?email=${this.email}`
                }
                return undefined;
            },
            loading(): boolean {
                return !this.authLoaded
            }
        },
        methods: {
            configureAnimations() {
                const controller = new ScrollMagic.Controller();

                const width = window.innerWidth;

                if (width >= 1140) {
                    new ScrollMagic.Scene({
                        offset: 1,
                        duration: '100%',
                    }).setTween("#pinkBlob", 1, {transform: 'translate(0, 0) rotate(15deg)'})
                        .addTo(controller);
                } else if (width < 1140) {
                    new ScrollMagic.Scene({
                        offset: 1,
                        duration: '100%',
                    }).setTween("#pinkBlob", 1, {transform: 'translate(81vw, 60vh)'})
                        .addTo(controller);
                }

                new ScrollMagic.Scene({
                    offset: 1,
                    duration: '500%',
                }).setTween("#yellowBlob1", 1, {transform: 'translate(-7vw, 99vh) rotate(15deg)'})
                    .addTo(controller);

                if (width >= 1140) {
                    new ScrollMagic.Scene({
                        offset: 1,
                        duration: '500%',
                    }).setTween("#greenBlob", 1, {transform: 'translate(13vw, -39vh)'})
                        .addTo(controller);
                } else if (width < 1140) {
                    new ScrollMagic.Scene({
                        offset: 1,
                        duration: '100%',
                    }).setTween("#greenBlob", 1, {transform: 'translate(-24vw, 65vh)'})
                        .addTo(controller);
                }
            }
        }

    })


    // document.addEventListener('DOMContentLoaded', () => {
    //     console.log("values loaded");
    //
    //     configureAnimations();
    // });
    //
</script>

<style lang="scss" scoped>
    @import "variables";
    @import "mixins";

    body {
        overflow-x: hidden;
    }

    html {
        @include maxW(768) {
            overflow-x: hidden;
        }
    }

    header {
        background: transparent;
        left: 0;
        margin: auto;
        max-width: 1200px;
        position: absolute;
        right: 0;
        width: 100%;
        z-index: 10;
    }

    .buttonContainer {
        z-index: 5;

        .button {
            display: inline-block;
            margin: 0 .4rem;
        }

        .button.white {
            background-color: white;
            box-shadow: none;
            color: $darkGreen;
        }
    }

    .hero {
        background-color: lighten($lightGreen, 5%);
        height: 100vh;
        position: relative;

        &:before {
            background-image: url(assets/images/yellowNeedleBlob.svg);
            background-repeat: no-repeat;
            background-size: 730px;
            content: "";
            height: 74rem;
            position: absolute;
            left: 0;
            top: 0;
            transform: rotate(-39deg) translate(64vw, 49vh);
            width: 74rem;
        }

        &:after {
            background-image: url(assets/images/stem2.svg);
            background-repeat: no-repeat;
            background-size: 170px;
            bottom: 80vh;
            content: "";
            height: 420px;
            left: 95vw;
            position: absolute;
            transform: rotate(25deg);
            width: 180px;
        }

        .copy {
            align-items: center;
            top: 0;
            display: flex;
            flex-flow: column wrap;
            height: 100vh;
            justify-content: center;
            padding: 2.4rem;
            position: sticky;
            text-align: center;
            z-index: 3;
        }

        .logoLink {
            display: block;
            margin-left: 32px;
            position: absolute;
            top: 24px;
            z-index: 3;
        }

        h4 {
            color: $darkestPink;
            margin-bottom: .8rem;
        }

        h1 {
            margin-bottom: 1.6rem;
        }

        .subtext {
            margin: 0 auto 3.2rem;
            max-width: 47rem;

            @include r(768) {
                font-size: 2.4rem;
            }
        }
    }

    #yellowBlob1 {
        display: none;

        @include r(768) {
            display: block;
            height: 60rem;
            position: absolute;
            right: -13vw;
            top: -25vh;
            transform: rotate(-140deg);
            width: 57rem;
        }
    }

    #pinkBlob {
        display: none;

        @include r(1140) {
            display: block;
            height: 21rem;
            left: 0;
            position: absolute;
            top: 0;
            transform: translate(-7vw, 28vh);
            width: 21rem;
        }
    }

    #greenBlob {
        display: none;

        @include r(1140) {
            display: block;
            height: 52rem;
            left: 0;
            position: absolute;
            top: 0;
            transform: rotate(55deg) translate(13vw, 39vh);
            width: 50rem;
        }
    }

    #stem {
        bottom: -12vh;
        display: block;
        left: -12rem;
        position: absolute;

        @include r(1024) {
            bottom: -17vh;
            left: -6vw;
        }
    }

    // End Hero

    .listHeader {
        color: $darkestPink;
    }

    .list {
        .subtext {
            display: none;

            @include r(768) {
                display: block;
                margin-bottom: 4.8rem;
            }
        }
    }

    .threeUp {
        padding: 8rem 2.4rem;
        position: relative;

        @include r(768) {
            padding: 9rem 2.4rem;
        }

        .listHeader {
            margin: 0 0 4rem;

            @include r(768) {
                margin-bottom: 1.6rem;
            }
        }

        .benefit {
            padding-bottom: 7.2rem;

            &:last-of-type {
                padding-bottom: 0;
            }

            @include r(768) {
                flex-basis: 33%;
                padding: 0 .8rem;
            }

            .text {
                color: $darkText;
                margin: 0 auto;
                max-width: 40rem;

                @include r(768) {
                    padding: 0 2.4rem;
                }
            }
        }

        .illustration {
            margin-bottom: 2.4rem;
            max-width: 30rem;
            height: auto;
            width: 100%;
        }
    }

    .flexContainer {
        @include r(768) {
            display: flex;
            justify-content: center;
        }
    }

    .twoUp {
        padding: 8rem 2.4rem;

        @include r(768) {
            padding: 8.8rem 2.4rem;
        }

        &.pink {
            background-color: lighten($lightPink, 3%);
        }

        &.green {
            background-color: lighten($lightGreen, 10%);
        }

        &.noPaddingBtm {
            padding-bottom: 0;

            .text {
                padding-bottom: 8rem;

                @include r(768) {
                    padding-bottom: 8.8rem;
                }
            }
        }

        .centered {
            max-width: 60rem;
            text-align: left;

            @include r(768) {
                align-items: center;
                display: grid;
                grid-column-gap: 6.4rem;
                grid-template-columns: 1fr 1fr;
                justify-items: center;
                max-width: 120rem;
            }
        }

        h2 {
            margin-bottom: 1.6rem;
        }

        .graphic {
            display: block;
            margin: 0 auto 3.2rem;
            width: 100%;

            @include r(768) {
                margin: 0;
            }

            &.flip {
                transform: scaleX(-1);
            }
        }

        .text {
            @include r(768) {
                max-width: 42rem;
            }

            p {
                margin-bottom: 1.6rem;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }

        .button {
            display: inline-block;
            margin-top: .8rem;
        }

        .cropped {
            align-items: flex-start;
            display: flex;
            justify-content: center;
            margin: 0 -2.4rem -6.4rem;
            max-height: 53rem;
            overflow: hidden;
            transform: translateY(-6.4rem);

            .graphic {
                width: 120%;
            }

            @include r(600) {
                margin: 0 auto -6.4rem;
                max-width: 57rem;
            }

            @include r(768) {
                display: block;
                margin: 0 0 -6.4rem;
                padding: 0 4.4rem;

                .graphic {
                    width: 100%;
                }
            }
        }
    }
</style>
