<template>
    <div>
        <div class="">
            <section class="header">
                <div class="nav-wrapper">
                    <NavBar v-bind:isSticky="false"/>
                </div>
                <div class="content">
                    <p class="label">Cactus Presents</p>
                    <h1>Your Core Values</h1>
                    <p>
                        Your core values will help you understand past decisions and make better decisions for your happiness in the future.
                    </p>
                    <div class="cta">
                        <!--Start Survey Button Logic (logged in sate)-->
                        <div v-bind:class="['wrapper', {loading: loading}]">
                            <div class="container logged-in" v-show="member && !loading">
                                <a class="button" v-show="surveyLink" v-bind:href="surveyLink">Take the Survey</a>
                            </div>
                            <div class="container logged-out" v-show="!member && !loading">
                                <AuthButton linkText="Sign in to continue" linkUrl="/values" variant="button"></AuthButton>
                            </div>
                        </div>
                        <!--END: Start Survey Button Logic (logged in sate)-->
                    </div>

                </div>
            </section>
            <section class="how-it-works centered">
                <h2>How It Works</h2>
                <p>In less than five minutes you'll discover what your true values are.</p>
                <div class="flexContainer">
                    <div class="benefit">
                        <img src="/assets/images/balloons.svg" alt="Happy with some balloons" class="illustration" />
                        <p class="text">Identify the values important to you and that you want to improve</p>
                    </div>
                    <div class="benefit friends">
                        <img src="/assets/images/friends.svg" alt="Picture with my friends" class="illustration" />
                        <p class="text">Send to 3+ people close to you and <i>anonymously</i> see what your friends value in you the most</p>
                    </div>
                    <div class="benefit">
                        <img src="assets/images/thrive.svg" alt="Looking in the mirror" class="illustration" />
                        <p class="text">Discover the values important to you and use them to liv ea happier, healthier life</p>
                    </div>
                </div>
            </section>
            <section class="why pink flexContainer">
                <img src="assets/images/treeSwing.svg" alt="Looking in the mirror" class="illustration" />
                <aside>
                    <h2>What is most important for you?</h2>
                    <p>Knowing your core values will help you achieve a higher level of self-awareness. You'll start to understand past decisions and make better decisions for your happiness in the future. </p>
                </aside>
            </section>
            <section class="why white flexContainer">
                <aside>
                    <h2>Your daily Cactus starts to get personal</h2>
                    <p>Your core values results will help guide your future Cactus reflections and prompts</p>
                </aside>
                <img src="assets/images/scooter.svg" alt="Looking in the mirror" class="illustration" />
            </section>
            <section class="why blue flexContainer">
                <img src="assets/images/pizza.svg" alt="Looking in the mirror" class="illustration" />
                <aside>
                    <h2>The best feedback, from who know you best</h2>
                    <p>Getting feedback from others is a great way to fortify the strengths you see in yourself and to discover the strengths in you that you don't see.</p>
                </aside>
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

    let emailParam = getQueryParam(QueryParam.EMAIL) || getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);

    if (!emailParam) {

    }

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
                email: emailParam,
                member: undefined,
                authLoaded: false,
                memberUnsubscriber: undefined,
            }
        },
        computed: {
            surveyLink():string|undefined {
                if (this.email){
                    return `https://www.surveymonkey.com/r/cactus-core-values?email=${this.email}`
                }
                return undefined;
            },
            loading():boolean {
                return !this.authLoaded
            }
        },

    })
</script>

<style lang="scss" scoped>
    @import "variables";
    @import "mixins";

    .label {
        text-transform: uppercase;
        color: $darkestPink;
        font-size: 1.6rem;
    }

    section {
        padding: 3rem;
        h2 {
            color: $darkestPink;
        }
    }

    .header {
        background-color: $lightBlue;
        position: relative;
        .nav-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
        }
        .content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 70vh;
            padding: 1rem;
            max-width: 60rem;
            margin: 0 auto;
            text-align: center;

            .cta {
                margin-top: 4rem;
            }
        }
    }


    .how-it-works {
        .benefit {
            padding-bottom: 5.6rem;

            @include r(768) {
                flex-basis: 33%;
                padding-bottom: 0;
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
            height: 21rem;
            width: 23rem;
        }

        .flexContainer {
            margin-top: 4rem;
            @include r(768) {
                display: flex;
                justify-content: center;
                flex-direction: row-reverse;
            }
        }
    }

    .why {
        background-color: $pink;

        &.white{
            background-color: white;
        }

        &.blue{
            background-color: $lightBlue;
        }

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .illustration {
            max-width: 40vw;
        }

        @include r(768) {
            justify-content: space-between;
            flex-direction: row;
        }

        aside {
            padding: 4rem;
            h2 {
                color: $darkText;
            }
        }
    }




</style>