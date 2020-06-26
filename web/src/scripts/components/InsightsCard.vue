<template>
    <div class="insightsCard">
        <h2>Insights</h2>
        <p class="subtext">This is what your note reveals about your emotions.</p>
        <div class="posRating">
            <span class="label">Positivity Rating</span>
            <strong class="rating">{{positivityRating}}</strong>
            <div class="progress">
                <div class="meter" :style="`width: ${positivityRating}`"><span class="gradient"></span></div>
            </div>
        </div>
        <div class="sentimentAnalysis">
            <nav class="tabs">
                <a v-for="(emotion, i) in emotions" :key="`emotion_${i}`" class="emotion">{{emotion}}</a>
            </nav>
            <div class="noteText">
                <p>Released 50 years ago this week, Black Sabbath’s self-titled debut almost single-handedly launched the heavy metal genre.</p>
                <p>But in 1970, it wasn’t seen as much of a harbinger of things to come.</p>
                <p>“The whole album is a shuck,” wrote Lester Bangs.</p>
                <p class="highlight">“The worst of the counterculture on a plastic platter—bullshit necromancy, drug-impaired reaction time, long solos, everything,” complained Robert Christgau.</p>
                <p>The rock critic cognoscenti was soon proven wrong: Black Sabbath and the band’s subsequent albums served as the foundational texts for countless acts who fell hard for Sabbath’s singular mix of bone-crunching riffs, adolescent alienation and vintage Hammer horror flicks.</p>
                <p>In celebration of half a century of Sabbath, let’s dig into essential rarities from the band’s first decade (aka the Ozzy era).</p>
            </div>
        </div>
        <button class="contButton">Continue</button>
        <button class="infoButton tertiary icon" @click="showModal">
            <svg-icon icon="info" class="infoIcon" />
        </button>
        <tone-analyzer-modal
            :showModal="modalVisible"
            @close="modalVisible = false" />
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ToneAnalyzerModal from "@components/ToneAnalyzerModal.vue"
    import SvgIcon from "@components/SvgIcon.vue";

    export default Vue.extend({
        components: {
            ToneAnalyzerModal,
            SvgIcon,
        },
        created() {

        },
        props: {
            positivityRating: {
                type: String,
                default: "40%"
            },
            emotions: {
                type: Array,
                default: () => ([
                    "Anger",
                    "Fear",
                    "Sadness",
                    "Analytical",
                    "Confident",
                    "Tentative"
                ])
            },
        },
        data(): {
            modalVisible: boolean,
        } {
            return {
                modalVisible: false,
            }
        },
        methods: {
            showModal() {
                this.modalVisible = true;
            },
            hideModal() {
                this.modalVisible = false;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .insightsCard {
        background-color: $bgDolphin;
        padding: 3.2rem;
        position: relative;
        text-align: left;

        @include r(600) {
            padding: 4rem;
        }
    }

    .subtext {
        font-size: 1.6rem;
        margin-bottom: 3.2rem;
        opacity: .8;

        @include r(600) {
            font-size: 1.8rem;
            margin-bottom: 4rem;
        }
    }

    .label {
        font-size: 1.6rem;
        opacity: .8;

        &:after {
            content: ":";
            display: inline-block;
            margin-right: .8rem;
        }
    }

    .progress {
        $multiple: 1.6rem;
        background-color: lighten($lightDolphin, 20%);
        border-radius: $multiple;
        height: $multiple;
        margin: .8rem 0 3.2rem;

        @include r(600) {
            margin-bottom: 4rem;
        }

        .meter {
            border-radius: $multiple;
            height: $multiple;
            overflow: hidden;
            position: relative;
        }

        .gradient {
            background-image: linear-gradient(to right, $royal, $green);
            height: $multiple;
            left: 0;
            position: absolute;
            top: 0;
            width: 25.6rem;

            @include r(374) {
                width: 53.5rem;
            }
            @include r(600) {
                width: 40rem;
            }
            @include r(768) {
                width: 46.8rem;
            }
        }
    }

    .sentimentAnalysis {
        @include shadowbox;
        margin: 0 -3.2rem;
        position: relative;

        @include r(374) {
            margin: 0 -2rem;
        }
        @include r(600) {
            margin: 0 -2.4rem;
        }

        &:after {
            background-image: linear-gradient(to right, rgba(255,255,255,0), $white);
            content: "";
            height: 4rem;
            position: absolute;
            right: 0;
            top: 1.2rem;
            width: 4rem;
            z-index: 1;
        }
    }

    .tabs {
        background-color: $white;
        border-radius: 1.2rem 1.2rem 0 0;
        cursor: pointer;
        display: flex;
        font-weight: bold;
        overflow-x: auto;
        overflow-y: hidden;
        position: sticky;
        top: 0;
    }

    .emotion {
        padding: 2rem 1.6rem;

        &:first-child {
            color: $darkestGreen;
            padding-left: 3.2rem;

            @include r(374) {
                padding-left: 2.4rem;
            }
        }

        // &.current {
        //
        // }
    }

    .noteText {
        padding: 0 3.2rem 1.6rem;

        @include r(374) {
            padding: 0 2.4rem 3.2rem;
        }
        @include r(600) {
            padding: 0 2.4rem 3.2rem;
        }

        p {
            margin-bottom: 1.6rem;
        }
    }

    .highlight {
        background-color: lighten($royal, 20%);
        margin: 0 -.4rem 1.6rem;
        padding: .4rem;
    }

    .contButton {
        bottom: 3.2rem;
        left: 3.2rem;
        position: fixed;
        right: 3.2rem;
        width: calc(100% - 6.4rem);
        z-index: 1;

        @include r(600) {
            display: none;
        }
    }

    .infoButton {
        position: absolute;
        right: 8rem - 1.2rem;
        top: 2rem - 1.2rem;

        @include r(600) {
            right: .8rem;
        }
    }

</style>
