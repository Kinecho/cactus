<template>
    <div class="insightsCard">
        <h2>Insights</h2>
        <p class="subtext">This is what your note reveals about your emotions.</p>
        <positivity-rating :sentiment-score="reflectionResponse.sentiment.documentSentiment"/>
        <tone-analysis :tone-result="reflectionResponse.toneAnalysis"/>
        <button class="contButton">Continue</button>
        <button class="infoButton tertiary icon" @click="showModal">
            <svg-icon icon="info" class="infoIcon"/>
        </button>
        <tone-analyzer-modal
                :showModal="modalVisible"
                @close="hideModal()"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ToneAnalyzerModal from "@components/ToneAnalyzerModal.vue"
    import SvgIcon from "@components/SvgIcon.vue";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import PositivityRating from "@components/PositivityRating.vue";
    import ToneAnalysis from "@components/ToneAnalysis.vue";

    @Component({
        components: {
            ToneAnalysis,
            ToneAnalyzerModal,
            SvgIcon,
            PositivityRating,
        }
    })
    export default class InsightsCard extends Vue {

        @Prop({ type: Object as () => ReflectionResponse, required: true })
        reflectionResponse!: ReflectionResponse;

        modalVisible: boolean = false;

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
