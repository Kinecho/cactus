<template>
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
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class PromptGraphicAside extends Vue {
        name = "PromptGraphicAside";
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
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

</style>