<template>
    <div class="insightsCard">
        <h2>Insights</h2>
        <p class="subtext">This is what your note reveals about your emotions.</p>
        <div class="posRating">
            <span class="label">Positivity Rating</span>
            <strong class="rating">{{positivityRating}}</strong>
            <div class="progress">
                <div class="meter" :style="`width: ${positivityRating}`"></div>
            </div>
        </div>
        <div class="sentimentAnalysis">
            <nav class="tabs">
                <a>Anger</a>
                <a>Fear</a>
                <a>Joy</a>
                <a>Sadness</a>
                <a>Analytical</a>
                <a>Confident</a>
                <a>Tentative</a>
            </nav>
            <div class="noteText">
                {{noteText}}
            </div>
        </div>
        <button class="contButton">Continue</button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        created() {

        },
        props: {
            positivityRating: {
                type: String,
                default: "40%"
            },
            noteText: {
                type: String,
                default: `Released 50 years ago this week, Black Sabbath’s self-titled debut almost single-handedly launched the heavy metal genre.
                But in 1970, it wasn’t seen as much of a harbinger of things to come.
                “The whole album is a shuck,” wrote Lester Bangs.
                “The worst of the counterculture on a plastic platter—bullshit necromancy, drug-impaired reaction time, long solos, everything,” complained Robert Christgau.
                The rock critic cognoscenti was soon proven wrong: Black Sabbath and the band’s subsequent albums served as the foundational texts for countless acts who fell hard for Sabbath’s singular mix of bone-crunching riffs, adolescent alienation and vintage Hammer horror flicks.
                In celebration of half a century of Sabbath, let’s dig into essential rarities from the band’s first decade (aka the Ozzy era).`
            },
        },
        data(): {} {
            return {}
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
            background-image: linear-gradient(to right, $royal, $green);
            border-radius: $multiple;
            height: $multiple;
        }
    }

    .sentimentAnalysis {
        @include shadowbox;
        margin: 0 -2.4rem;
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

        a {
            padding: .8rem 1.6rem;

            @include r(600) {
                padding: 2.4rem 2rem;
            }
        }
    }

    .noteText {
        padding: 1.6rem;
        white-space: pre-line;

        @include r(600) {
            padding: 0 2.4rem 3.2rem;
        }
    }

    .contButton {
        @include r(600) {
            display: none;
        }
    }

</style>
