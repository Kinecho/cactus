<template>
    <section v-if="isPlusMember && gapAssessmentResults" class="gapContainer borderContainer">
        <div class="flexIt">
            <h2>Happiness Quiz Results</h2>
            <p class="subtext">The differences in your levels of importance and satisfaction across the five core elements of a balanced life.</p>
            <div class="gapFocus" v-if="memberFocusElement">
                <p class="statLabel">Focus</p>
                <h3>{{memberFocusElement}}</h3>
            </div>
            <div class="legend">
                <gap-analysis-legend :stacked="true"/>
            </div>
        </div>
        <div class="radarChartContainer">
            <spinner v-if="loading" message="Loading Results..." :delay="1200"/>
            <Results v-if="!loading && gapAssessmentResults"
                    :results="gapAssessmentResults"
                    :selectable-elements="selectFocusEnabled"
                    :pulsing-enabled="selectFocusEnabled"
                    :hideElements="false"
                    :selected-element="radarChartSelectedElement"
                    @elementSelected="setSelectedElement"
                    :withLabel="showElementLabels"
                    :showElementImages="false"
                    :showLegend="false"
            />
            <div class="legend">
                <gap-analysis-legend/>
            </div>
        </div>
        <div v-if="selectFocusEnabled" class="gapActions">
            <p>Tap a cactus to choose a focus.</p>
            <p v-if="currentElementSelection">
                You've selected: {{currentElementSelection || 'nothing yet'}}
            </p>
            <button class="small secondary" @click="cancelSetFocus">Cancel</button>
            <button class="small" @click="saveFocus">Done</button>
        </div>
        <p v-else-if="false" class="gapActions">
            Your focus is <strong>{{memberFocusElement}}</strong>. To change your focus...
            <button class="secondary small" @click="selectFocusEnabled = true">Change your focus</button>
        </p>
        <p v-else-if="false" class="gapActions">
            <button class="secondary small" @click="selectFocusEnabled = true">Choose a focus</button>
        </p>
        <dropdown-menu :items="mentalFitnessDropdownLinks" class="dotsBtn"/>
    </section>
    <!-- Show PLUS User Empty State message -->
    <section v-else-if="isPlusMember" class="plus nogapContainer borderContainer">
        <h2>Happiness Quiz</h2>
        <p class="subtext">Find the gap between what is important to you and how satisfied you are regarding
            that area of your&nbsp;life.</p>
        <router-link tag="button" class="esButton" :to="gapAssessmentHref">Take the
            <span>Mental Fitness</span> quiz
        </router-link>
    </section>
    <!-- Show BASIC User Upgrade message -->
    <section v-else-if="!isPlusMember" class="basic nogapContainer borderContainer">
        <h2>What makes you happy?</h2>
        <p class="subtext">Get access to the quiz that helps you identify and focus on the people, places, and things
            that make you happy.</p>
        <router-link tag="button" class="esButton" :to="pricingHref">Try Cactus Plus
        </router-link>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { DropdownMenuLink } from "@components/DropdownMenuTypes";
    import { PageRoute } from "@shared/PageRoutes";
    import DropdownMenu from "@components/DropdownMenu.vue";
    import { Prop } from "vue-property-decorator";
    import { CactusElement } from "@shared/models/CactusElement";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import Results from "@components/gapanalysis/Results.vue";
    import Spinner from "@components/Spinner.vue";
    import GapAnalysisLegend from "@components/gapanalysis/GapAnalysisLegend.vue";

    @Component({
        components: {
            DropdownMenu,
            Results,
            GapAnalysisLegend,
            Spinner
        }
    })
    export default class GapAnalysisWidget extends Vue {
        name = "GapAnalysisWidget";

        @Prop({ type: Boolean, default: false })
        isPlusMember!: boolean;

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: false, default: null })
        gapAssessmentResults!: GapAnalysisAssessmentResult | null;

        @Prop({ type: Boolean, default: false, })
        loading!: boolean;

        @Prop({ type: String as () => CactusElement, required: false, default: null })
        memberFocusElement!: CactusElement | null;

        @Prop({ type: Boolean, required: false, default: true })
        showGapAnalysisLabels!: boolean;

        @Prop({ type: Boolean, required: false, default: true })
        showLegend!: boolean;

        selectFocusEnabled = false;
        currentElementSelection: CactusElement | null = null

        get mentalFitnessDropdownLinks(): DropdownMenuLink[] {
            return [{
                title: "Retake Quiz",
                href: PageRoute.GAP_ANALYSIS,
            }];
        }

        get pricingHref(): string {
            return PageRoute.PRICING;
        }

        get gapAssessmentHref(): string {
            return PageRoute.GAP_ANALYSIS;
        }

        cancelSetFocus() {
            this.selectFocusEnabled = false;
            this.currentElementSelection = null;
        }

        get showElementLabels(): boolean {
            return this.selectFocusEnabled || this.showGapAnalysisLabels;
        }

        get radarChartSelectedElement(): CactusElement | null {
            if (this.selectFocusEnabled) {
                return this.currentElementSelection;
            }
            return this.memberFocusElement;
        }

        async setSelectedElement(element: CactusElement | null) {
            this.currentElementSelection = element;
        }

        saveFocus() {
            this.$emit('focusElement', this.currentElementSelection);
            this.selectFocusEnabled = false;
            this.currentElementSelection = null;
        }
    }
</script>

<style scoped lang="scss">
    @import "common";
    @import "variables";
    @import "mixins";
    @import "insights";

    .gapContainer {
        @include r(768) {
            flex-basis: 50%;
            margin-right: 1.6rem;
        }
        @include r(960) {
            display: flex;
            flex-basis: 66%;
            flex-direction: row;
        }

        .subtext {
            margin: 0 0 4rem;
        }
    }

    .flexIt {

        .legend {
            display: none;
        }

        @include r(960) {
            width: 45%;

            .legend {
                display: flex;
            }
        }
    }

    .gapFocus {
        margin-bottom: 4rem;

        @include r(960) {
            margin-bottom: 0;
        }
    }

    .radarChartContainer {
        margin: 0 auto;
        max-width: 38rem;
        width: 100%;

        @include r(960) {
            padding-left: 3.2rem;
            width: 55%;

            .legend {
                display: none;
            }
        }
    }

    .nogapContainer {
        @include shadowbox;
        order: 2;
        position: relative;

        @include r(768) {
            flex-basis: 50%;
            flex-grow: 1;
            order: 2;
        }

        &.plus {
            background-image: url(/assets/images/crosses2.svg),
            url(/assets/images/outlineBlob.svg),
            url(/assets/images/royalBlob.svg),
            url(/assets/images/pinkBlob5.svg);
            background-position: -1rem 18rem, right -29rem top -32rem, -11rem 16rem, 61% -133px;
            background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
            background-size: 20rem, 48rem, 30rem, 23rem;

            @include r(768) {
                background-position: -1rem 28rem, right -9rem top -32rem, -11rem 32rem, 61% -133px;
            }
        }

        &.basic {
            background: url(/assets/images/radarChartGraphic.svg) center top 14rem no-repeat;
            padding-bottom: 7.2rem;

            @include r(600) {
                background-position: right -38rem center;
                padding-bottom: 3.2rem;

                .subtext {
                    max-width: 66%;
                }
            }

            @include r(768) {
                background-size: 150%;
                background-position: center top 22rem;

                .subtext {
                    max-width: none;
                }
            }
        }

        h2 {
            margin-bottom: .4rem;
        }

        .subtext {
            margin-bottom: 2.4rem;

            @include r(768) {
                max-width: 48rem;
            }
        }
    }

</style>
