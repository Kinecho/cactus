<template>
    <section class="testimonials list">
        <div class="centered">
            <h2>What people are saying</h2>
            <p class="subtext">The Cactus community reflect on their&nbsp;experiences</p>
            <div class="flexContainer">
                <TestimonialCard v-for="(testimonial, index) in testimonials" :testimonial="testimonial" :key="`testimonial_${index}`"/>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Testimonial } from "@components/landingPages/TestomonialTypes";
    import TestimonialCard from "@components/landingPages/TestimonialCard.vue";

    @Component({
        components: { TestimonialCard }
    })
    export default class Testimonials extends Vue {
        name = "Testimonials";

        get testimonials(): Testimonial[] {
            return [
                {
                    quote: "I needed motivation and guidance to think about what I want in life. Cactus reinforces positive thinking and **keeps me accountable** to reflect on what brings me joy.",
                    avatarUrl: "/assets/images/avatars/testimonialAvatar3.png",
                    name: "Samantha W"
                },
                {
                    quote: "I was hoping to practice daily gratitude, but I needed a little help getting started. Cactus provided an opportunity to **reflect in an approachable way**, and I find myself in higher spirits after using it.",
                    avatarUrl: "/assets/images/avatars/testimonialAvatar1.png",
                    name: "Thom M"
                }, {
                    quote: "I wanted to try a **different kind of mindfulness**. Cactus is surprisingly enjoyable and helped me find clarity, and now I'm more open to consider new things.",
                    avatarUrl: "/assets/images/avatars/testimonialAvatar2.png",
                    name: "Mike P",
                },
                {
                    quote: "First thing in the morning, in the midst of checking work emails and feeling the anxiety of the day creep, the Cactus emails **help me pause**, reset my attitude, and begin the day on a positive note before I even get out of bed.",
                    avatarUrl: "/assets/images/avatars/testimonialAvatar4.png",
                    name: "Nicole P",
                }
            ]
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .testimonials {
        background-image: linear-gradient(180deg, #F8F6F5 0%, $white 20%);
        padding: 4.8rem 0 0;

        @include r(768) {
            padding: 11rem 0 0;
        }

        .subtext {
            opacity: .8;
            padding: 0 2.4rem 2.4rem;

            @include r(768) {
                padding-bottom: 4rem;
            }
            @include r(960) {
                font-size: 2rem;
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

    }
</style>