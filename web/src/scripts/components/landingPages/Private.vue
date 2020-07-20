<template>
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
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class Private extends Vue {
        name = "Private";
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .subtext {
        opacity: .8;
        margin: 0 auto 2.4rem;
        max-width: 40rem;
        text-align: center;

        @include r(768) {
            margin-bottom: 5.6rem;
        }
        @include r(960) {
            font-size: 2rem;
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
</style>