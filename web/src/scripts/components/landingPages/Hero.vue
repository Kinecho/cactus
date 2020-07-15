<template>
    <div class="centered">
        <section class="hero">
            <div class="heroText">
                <h1>{{title}}</h1>
                <p class="subtext" v-if="subText">{{subText}}</p>
                <slot></slot>
            </div>
            <prompt-graphic-aside class="graphicContainer"/>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import PromptGraphicAside from "@components/landingPages/PromptGraphicAside.vue";

    @Component({
        components: { PromptGraphicAside }
    })
    export default class Hero extends Vue {
        name = "Hero";

        @Prop({ type: String, required: true })
        title!: string;

        @Prop({ type: String, required: false, default: null })
        subText!: string | null;
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .subtext {
        opacity: .8;

        @include r(960) {
            font-size: 2rem;
        }
    }

    .hero {
        margin: 2.4rem auto 0;
        max-width: 50rem;
        position: relative;

        @include r(600) {
            margin-top: 4.8rem;
        }
        @include r(768) {
            align-items: center;
            display: flex;
            margin-top: 0;
            max-width: none;
            padding: 0 1.6rem;
        }
        @include r(1200) {
            padding: 0;
        }

        .heroText {
            margin: 0 auto 4.8rem;
            max-width: 60rem;

            @include r(768) {
                margin: 0;
                text-align: left;
                width: 50%;
            }
            @include r(1024) {
                width: 53%;
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
                justify-content: flex-start;
                max-width: 70rem;
                padding: 0 2.4rem 4.4rem 0;
                text-align: left;
                z-index: 2;
            }
            @include r(1140) {
                padding-bottom: 14rem;
            }

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
</style>