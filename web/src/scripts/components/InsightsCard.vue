<template>
    <div class="insightsCard">
        <h2>Insights</h2>
        <p class="subtext">This is what your note reveals about your emotions.</p>
        <positivity-rating :sentiment-score="reflectionResponse.sentiment.documentSentiment"/>
        <div class="sentimentAnalysis">
            <nav class="tabs">
                <a v-for="(tone, i) in tones" :key="`tone_${i}`" class="tone" :class="{selected: currentToneId === tone.toneId}" @click="currentToneIndex = i">{{tone.toneName}}</a>
            </nav>
            <div class="noteText">
                <p v-for="(sentence, i) in reflectionResponse.toneAnalysis.sentencesTones"
                        :key="`sentence_${i}`"
                        :class="{highlight: sentence.tones && sentence.tones.some(t => t.toneId === currentToneId)}"
                >
                    <span class="debug">({{sentence.tones.map(t => t.toneName).join(', ')}})</span>
                    <br/>
                    {{sentence.text}}

                </p>
            </div>
        </div>
        <button class="contButton">Continue</button>
        <button class="infoButton tertiary icon" @click="showModal">
            <svg-icon icon="info" class="infoIcon"/>
        </button>
        <tone-analyzer-modal
                :showModal="modalVisible"
                @close="modalVisible = false"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ToneAnalyzerModal from "@components/ToneAnalyzerModal.vue"
    import SvgIcon from "@components/SvgIcon.vue";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import { ToneID, ToneScore } from "@shared/api/ToneAnalyzerTypes";
    import PositivityRating from "@components/PositivityRating.vue";

    @Component({
        components: {
            ToneAnalyzerModal,
            SvgIcon,
            PositivityRating,
        }
    })
    export default class InsightsCard extends Vue {

        @Prop({ type: Object as () => ReflectionResponse, required: true })
        reflectionResponse!: ReflectionResponse;

        get tones(): ToneScore[] {
            return this.reflectionResponse.toneAnalysis?.documentTone?.tones ?? [];
        }

        currentToneIndex = 0;

        get currentToneId(): ToneID | null {
            if (!this.tones || this.tones.length === 0) {
                return null;
            }
            return this.tones[Math.min(this.currentToneIndex, this.tones.length - 1)]?.toneId ?? null;
        };

        modalVisible: boolean = false;

        get positivityRating(): number | undefined {
            return this.reflectionResponse.sentiment?.documentSentiment?.score ?? undefined
        };

        showModal() {
            this.modalVisible = true;
        }

        hideModal() {
            this.modalVisible = false;
        }

    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .insightsCard {
        background-color: $bgDolphin;
        padding: 5.6rem 3.2rem 3.2rem;
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
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0), $white);
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

    .tone {
        padding: 2rem 1.6rem;

        &:first-child {
            padding-left: 3.2rem;
            @include r(374) {
                padding-left: 2.4rem;
            }
        }

        &:hover {
            cursor: pointer;
        }

        &.selected {
            color: $darkestGreen;
        }
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
        right: 5.6rem;
        top: 2rem - 1.2rem;

        @include r(600) {
            right: .8rem;
        }
    }

    .debug {
        color: red;
        font-family: monospace;
    }

</style>
