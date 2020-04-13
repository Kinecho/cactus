<template>
    <div class="coreValuesPage">
        <NavBar :isSticky="false"/>
        <div class="centered">
            <h1>Core Values</h1>
            <!-- TODO: make booleans plusUser and hasValues work -->
            <template v-if="plusUser && !hasValues">
                <p>Core values are the general expression of what is most important for you, and they help you understand past decisions and make better decisions in the future.</p>
                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration of how your values have been at the heart of past decisions and how they will unlock a happier future. Your core values results will guide your Cactus reflections.</p>
                <p>Insert language about how long this will take or how many questions to set expectations...</p>
                <!-- TODO: hook up button -->
                <button class="primaryBtn">Take the Assessment</button>
            </template>
            <template v-if="!plusUser">
                <p>Different language? Core values are the general expression of what is most important for you, and they help you understand past decisions and make better decisions in the future.</p>
                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration of how your values have been at the heart of past decisions and how they will unlock a happier future. Your core values results will guide your Cactus reflections.</p>
                <p>Insert language about how long this will take or how many questions to set expectations...</p>
                <button class="primaryBtn" @click="goToPricing">Upgrade</button>
            </template>
            <template v-if="plusUser && hasValues">
                <p>Here are your core values. Through the Cactus prompts, you will come to better understand the origin, purpose, and meaning of your core values. This will help you understand past life decisions and, by prioritizing your values, make better decisions in the future.</p>
                <figure class="coreValuesCard">
                    <!-- TODO: hook up displayName -->
                    <h3><span class="cvName" v-if="displayName">{{displayName}}'s</span>Core Values</h3>
                    <div class="flexContainer">
                        <!-- TODO: insert random blob here -->
                        <img class="cvBlob" src="https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fsized%2F375_9999_99%2F200411.png?alt=media&token=6f2c2d46-d282-4c1a-87de-9259136c79a0" alt="core value blob graphic" />
                        <!-- TODO: make this list dynamic -->
                        <ul class="valuesList">
                            <li>Developer</li>
                            <li>Developer</li>
                            <li>Developer</li>
                            <li>Developer</li>
                            <li>Developer</li>
                        </ul>
                    </div>
                </figure>
                <button class="small">Share My Values</button>
                <p class="extraPadding">Not sure these are right or feel like they’ve changed? Feel free to <a class="fancyLink" href="">retake the assessment</a>.</p>
            </template>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import {PageRoute} from '@shared/PageRoutes'

    declare interface CoreValuesData {
        cactusMember?: CactusMember,
        hasValues: boolean,
        displayName: string,
    }

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
        },
        created(){

        },
        props: {

        },
        data(): CoreValuesData {
            return {
                cactusMember: undefined,
                hasValues: false,
                displayName: '',
            };
        },
        methods: {
            goToPricing() {
                window.location.href = PageRoute.PRICING;
            },
        },
        computed: {
            plusUser(): boolean {
                const tier = this.cactusMember?.tier ?? SubscriptionTier.PLUS;
                return (tier === SubscriptionTier.PLUS) ? true : false;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .coreValuesPage {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;

        header, .centered {
            width: 100%;
        }

        .centered {
            flex-grow: 1;
            max-width: 80rem;
            padding: 6.4rem 2.4rem;
            text-align: left;
        }

        h1 {
            margin-bottom: 1.6rem;
        }

        p {
            margin-bottom: 1.6rem;
            max-width: 64rem;
        }
    }

    .primaryBtn {
        display: block;
        margin-top: 2.4rem;
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .coreValuesCard {
        @include shadowbox;
        background-color: darken($royal, 6%);
        color: white;
        margin: 1.6rem auto 2.4rem;
        max-width: fit-content;
        padding: 2.4rem 0;
        text-align: center;
        width: auto;

        @include r(768) {
            margin: 3.2rem 0;
        }

        .flexContainer {
            display: flex;
        }

        .cvName {
            padding-right: .4rem;
        }

        ul {
            align-self: center;
            list-style: none;
            margin: 0 0 0 1.6rem;
            padding: 0 1.6rem 0 0;
            text-align: center;
            width: 100%;
        }

        li {
            font-size: 1.4rem;
            font-weight: bold;
            letter-spacing: 1px;
            list-style: none;
            margin: 0 0 .8rem;
            padding: 0;
            text-transform: uppercase;
        }

        h3 {
            margin-bottom: 1.6rem;
        }
    }

    .cvBlob {
        align-self: flex-start;
        height: auto;
        margin-bottom: -3.2rem;
        max-width: 20rem;
        transform: translate(-.8rem);
        width: 50%;
    }

    button.small {
        display: flex;
        margin: 0 auto;

        @include r(768) {
            margin: 0;
        }
    }

    .fancyLink {
        @include fancyLink;
    }

    .extraPadding {
        margin-top: 6.4rem;
    }

</style>
