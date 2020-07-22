<template>
    <div class="insightsCard" :data-disable-card-nav="true">
        <h2>Analysis</h2>
        <p class="subtext">This is what your note reveals about your emotions.</p>
        <transition name="component-fade" mode="out-in">
            <spinner v-if="loading" message="Processing insights" key="loader"/>
            <!--  Note: using a div on this wrapper so that transition works correctly -->
            <div v-else-if="reflectionResponse" :key="'insights'">
                <positivity-rating :sentiment-score="reflectionResponse.sentiment.documentSentiment"/>
                <tone-analysis :tone-result="reflectionResponse.toneAnalysis"
                        :original-text="reflectionResponse.content.text"
                        :use-no-results-fallback="true"
                        @previous="previous"
                        :sentences-on-new-line="false"/>
            </div>
        </transition>
        <!-- <button v-if="!loading" class="contButton" @click="next">Continue</button> -->
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import PositivityRating from "@components/PositivityRating.vue";
    import ToneAnalysis from "@components/ToneAnalysis.vue";
    import Spinner from "@components/Spinner.vue";

    @Component({
        components: {
            ToneAnalysis,
            PositivityRating,
            Spinner,
        }
    })
    export default class LegacyInsightsCard extends Vue {

        @Prop({ type: Object as () => ReflectionResponse, required: false, default: undefined })
        reflectionResponse!: ReflectionResponse | null | undefined;

        get loading(): boolean {
            return !this.reflectionResponse || this.reflectionResponse?.mightNeedInsightsUpdate === true;
        };

        next() {
            this.$emit("next");
        }

        previous() {
            this.$emit("previous");
        }
    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .insightsCard {
        background-color: $bgDolphin;
        min-height: 100vh;
        padding: 5.6rem 3.2rem 3.2rem;
        position: relative;
        text-align: left;

        @include r(600) {
            border-radius: 12px;
            box-shadow: 0 30px 160px -6px rgba(0, 0, 0, 0.3);
            margin-bottom: 6.4rem;
            min-height: 100%;
            padding: 5.6rem 4rem 4rem;
        }
    }

    h2 {
        @include r(600) {
            font-size: 3.2rem;
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
        position: sticky;
        right: 3.2rem;
        width: 100%;
        z-index: 1;

        @include r(600) {
            display: none;
        }
    }

</style>
