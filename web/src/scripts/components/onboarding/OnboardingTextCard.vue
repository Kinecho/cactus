<template>
    <div class="text-card">
        <div class="textBox">
            <markdown-text v-if="markdownText" :source="markdownText"/>
            <div class="actions" v-if="card.buttons && card.buttons.length > 0">
                <ActionButton v-for="(button, index) in card.buttons"
                        :key="index"
                        :button="button"
                        @complete="closeOnboarding"
                />
            </div>
        </div>
        <img height="300" width="300" class="image" v-if="card.imageUrl" :src="card.imageUrl" alt="Image"/>
        <video v-if="card.videoUrl" muted autoplay>
            <source :src="card.videoUrl" type="video/mp4">
        </video>
        <div v-if="card.demo" class="animationContainer" :class="{'overflow': overflow}">
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
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";
    import OnboardingActionButton from "@components/OnboardingActionButton.vue";
    import CactusMember from "@shared/models/CactusMember";
    import { CoreValue } from "@shared/models/CoreValueTypes";

    @Component({
        components: {
            MarkdownText,
            ActionButton: OnboardingActionButton,
        }
    })
    export default class OnboardingTextCard extends Vue {
        name = "OnboardingTextCard.vue";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: String, required: false, default: null })
        selectedInsightWord!: string | null;

        @Prop({type: String as CoreValue, required: false, default: null})
        selectedCoreValue!: CoreValue | null;

        @Prop({ type: Boolean, required: false, default: false })
        overflow!: boolean | undefined;

        get markdownText() {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsightWord, selectedCoreValue: this.selectedCoreValue })
        }

        closeOnboarding() {
            this.$emit('close', true)
        }

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
                width: 34rem;
            }
            100% {
                transform: scale(1);
                width: 34rem;
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

    .text-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            justify-content: center;
            margin: 0 auto;
            max-width: 48rem;
            padding: 0 2.4rem;
        }
        @include r(768) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            max-width: none;
            padding: 0 3.2rem;
        }
        @include r(960) {
            padding: 0 6.4rem;
        }
    }

    .textBox {
        margin-bottom: 5.6rem;

        @include r(768) {
            margin-bottom: 0;
            padding-right: 3.2rem;
            width: 66%;
        }
        @include r(960) {
            padding-right: 6.4rem;
        }
    }

    .image,
    video {
        height: auto;
        width: 100%;

        @include r(768) {
            align-self: center;
            max-width: 40%;
        }
    }

    .actions {
        bottom: 2.4rem;
        left: 2.4rem;
        position: fixed;
        right: 2.4rem;

        @include r(768) {
            margin-top: 3.2rem;
            position: static;
        }

        button {
            width: 100%;

            @include r(768) {
                min-width: 24rem;
                width: auto;
            }
        }
    }
</style>
