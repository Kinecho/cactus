<template>
    <div class="animationContainer" :class="{'overflow': overflow}">
            <div class="phoneMask">
                <div class="stats">
                    <img class="duration stat" src="/assets/images/durationStat.svg" alt="duration stat" />
                    <img class="reflections stat" src="/assets/images/reflectionsStat.svg" alt="reflections stat" />
                    <img class="streak stat" src="/assets/images/streakStat.svg" alt="streak stat" />
                </div>
                <img class="prompt" src="/assets/images/promptExample.png" alt="prompt" />
                <img class="positivity" src="/assets/images/positivityRating.svg" alt="positivity rating" />
                <img class="emotions" src="/assets/images/emotionsExample.svg" alt="emotions" />
                <img class="cv" src="/assets/images/cvExample.png" alt="core values" />
            </div>
        </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";

    export default class HomeDemoAnimation extends Vue {
        name = "HomeDemoAnimation.vue";

        @Prop({ type: Boolean, required: false, default: false })
        overflow!: boolean | undefined;

        //Below is causing this error: Avoid mutating a prop directly since the value will be overwritten whenever
        //the parent component re-renders. Instead, use a data or computed property based on the prop's value. 
        //Prop being mutated: "overflow"
        mounted() {
            setTimeout(() => this.overflow = true, 2500);
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    @keyframes resizeMob {
        100% {
            background-color: rgba(255,255,255,.6);
            box-shadow: 0 40px 170px -38px rgba(0, 0, 0, 0.7);
            height: 460px;
            width: 255px;
        }
    }
    @keyframes resize {
        100% {
            background-color: rgba(255,255,255,.6);
            box-shadow: 0 40px 170px -38px rgba(0, 0, 0, 0.7);
            height: 667px;
            width: 375px;
        }
    }

    .animationContainer {
        animation: resizeMob .5s 2s 1 ease-in forwards;
        background-color: transparent;
        border-radius: 2.4rem;
        box-shadow: none;
        height: 420px;
        margin: 0 auto;
        padding: 1.2rem;
        position: relative;
        transform: translateZ(0);
        width: 250px;

        @include r(600) {
            animation-name: resize;
            align-self: center;
            height: 750px;
            padding: 2.4rem 1.2rem;
            width: 350px;
        }

        &.overflow {
            overflow: hidden;
            overflow-y: auto;
        }

        @keyframes scroll {
            50% {
                transform: translateY(-3%);
            }
            100% {
                transform: translateY(0);
            }
        }

        .phoneMask {
            align-items: flex-start;

            @include r(768) {
                animation: scroll .3s 3s ease-in forwards;
            }
        }

        @keyframes sizeUpMob {
            40% {
                width: 34rem;
            }
            100% {
                transform: scale(.75) translate(-55px, 0px);
                width: 34rem;
            }
        }
        @keyframes sizeUp {
            40% {
                width: 37rem;
            }
            100% {
                transform: scale(1);
                width: 37rem;
            }
        }

        .stats {
            animation: sizeUpMob .5s 2s ease-in forwards;
            display: flex;
            margin-bottom: .8rem;
            overflow: hidden;
            transform: scale(0.5) translate(-763px, -7px);
            width: 60rem;

            @include r(600) {
                animation-name: sizeUp;
                margin-bottom: 2.4rem;
                transform: scale(0.75) translate(-443px, 63px);
            }

            img {
                animation: none;
                margin-right: .8rem;
                transform: none;
            }
        }

        @keyframes reset {
            100% {
                transform: scale(1);
                width: 100%;
            }
        }

        img {
            animation: reset .3s 2s ease-in forwards;
            position: relative;
            transform: scale(.75);
            z-index: 0;
        }

        .prompt {
            filter: drop-shadow(0 24px 25px rgba(0, 0, 0, 0.5));
            margin-bottom: 1.6rem;
            transform: scale(0.5) translate(-100px, -190px);
            width: 32rem;
            z-index: 5;

            @include r(600) {
                margin-bottom: 2.4rem;
                transform: scale(.75);
            }
        }

        @keyframes CVresetMob {
            100% {
                transform: scale(1);
                width: 31rem;
            }
        }
        @keyframes CVreset {
            100% {
                transform: scale(1);
                width: 43rem;
            }
        }

        .cv {
            animation: CVresetMob .3s 2s ease-in forwards;
            transform: scale(0.5) translate(-34px, -2342px);
            width: 43rem;

            @include r(600) {
                animation-name: CVreset;
                transform: scale(0.75) translate(206px, -1362px);
            }
        }

        .emotions {
            transform: scale(0.5) translate(-106%, -1500px);
            width: 32rem;

            @include r(600) {
                transform: scale(0.75) translate(-44%, -810px);
            }
        }

        .positivity {
            margin-bottom: 1.6rem;
            transform: scale(0.5) translate(0%, -1047px);
            width: 32rem;

            @include r(600) {
                margin-bottom: 2.4rem;
                transform: scale(0.75) translate(70%, -577px);
            }
        }
    }
</style>