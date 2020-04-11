<template>
    <div class="coreValuesPage">
        <NavBar :isSticky="false"/>
        <div class="centered">
            <template v-if="plusUser && !hasValues">
                <h1>Core Values</h1>
                <p>Core values are the general expression of what is most important for you, and they help you understand past decisions and make better decisions in the future.</p>
                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration of how your values have been at the heart of past decisions and how they will unlock a happier future. Your core values results will guide your Cactus reflections.</p>
                <p>Insert language about how long this will take or how many questions to set expectations...</p>
                <button>Take the Assessment</button>
            </template>
            <template v-if="!plusUser">
                <h1>Core Values ain't free</h1>
                <p>Core values are the general expression of what is most important for you, and they help you understand past decisions and make better decisions in the future.</p>
                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration of how your values have been at the heart of past decisions and how they will unlock a happier future. Your core values results will guide your Cactus reflections.</p>
                <p>Insert language about how long this will take or how many questions to set expectations...</p>
                <button>Upgrade</button>
            </template>
            <template v-if="plusUser && hasValues">
                <h1>Core Values</h1>
                <p>Here are your core values. Through the Cactus prompts, you will come to better understand the origin, purpose, and meaning of your core values. This will help you understand past life decisions and, by prioritizing your values, make better decisions in the future.</p>
                <figure class="coreValuesCard">
                    <h3>Mike's Core Values</h3>
                    <div class="flexContainer">
                        <p>rando flamelink image</p>
                        <ul class="valuesList">
                            <li>Developer</li>
                        </ul>
                    </div>
                </figure>
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

    declare interface CoreValuesData {
        cactusMember?: CactusMember,
        hasValues: boolean,
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
            };
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

        button {
            display: block;
            margin-top: 2.4rem;
            width: 100%;

            @include r(600) {
                width: auto;
            }
        }
    }

    .coreValuesCard {
        background-color: $dolphin;
        border-radius: 1.2rem;
        color: white;
        display: inline-block;
        margin: 0 0 3.2rem;
        padding: 2.4rem 0;
        text-align: center;
        width: auto;

        .flexContainer {
            display: flex;
        }

        ul, li {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        li {
            font-size: 1.4rem;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
    }

</style>
