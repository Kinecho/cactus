<template>
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
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class WhyCactus extends Vue {
        name = "WhyCactus";


    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

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
</style>