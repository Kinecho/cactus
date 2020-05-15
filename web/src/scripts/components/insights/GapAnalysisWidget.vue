<template>
    <section v-if="isPlusMember && gapAssessmentResults" class="gapContainer borderContainer">
        <h2>Happiness Quiz</h2>
        <p class="subtext">The comparison of what you find <strong class="pink">important</strong> and what
            you find <strong class="blue">satisfactory</strong></p>
        <spinner v-if="loading" message="Loading Results..." :delay="1200"/>
        <Results v-if="!loading && gapAssessmentResults"
                :results="gapAssessmentResults"
                :selectable-elements="selectFocusEnabled"
                :pulsing-enabled="selectFocusEnabled"
                :hideElements="false"
                :selected-element="radarChartSelectedElement"
                @elementSelected="setSelectedElement"
        />
        <div v-if="selectFocusEnabled" class="gapActions">
            <p>Tap a cactus to choose a focus.</p>
            <p v-if="currentElementSelection">
                You've selected: {{currentElementSelection || 'nothing yet'}}
            </p>
            <button class="small secondary" @click="cancelSetFocus">Cancel</button>
            <button class="small" @click="saveFocus">Done</button>

        </div>
        <p v-else-if="memberFocusElement && !selectFocusEnabled" class="gapActions">
            Your focus is <strong>{{memberFocusElement}}</strong>. To change your focus...
            <button class="secondary small" @click="selectFocusEnabled = true">Change your focus</button>
        </p>
        <p v-else-if="!selectFocusEnabled" class="gapActions">
            <button class="secondary small" @click="selectFocusEnabled = true">Choose a focus</button>
        </p>
        <dropdown-menu :items="mentalFitnessDropdownLinks" class="dotsBtn"/>
    </section>
    <!-- Show PLUS User Empty State message -->
    <section v-else-if="isPlusMember" class="nogapContainer borderContainer">
        <h2>Happiness Quiz</h2>
        <p class="subtext">Find the gap between what is important to you and how satisfied you are regarding
            that area of your&nbsp;life.</p>
        <router-link tag="button" class="esButton" :to="gapAssessmentHref">Take the
            <span>Mental Fitness</span> Quiz
        </router-link>
    </section>
    <!-- Show BASIC User Upgrade message -->
    <section v-else-if="!isPlusMember" class="nogapContainer borderContainer">
        <h2>Happiness Quiz</h2>
        <p class="subtext">NEEDS WORK To choose your focus, upgrade to Cactus Plus </p>
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

    @Component({
        components: {
            DropdownMenu,
            Results,
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

    .chart-container {
        margin: 0 auto;
        max-width: 40rem;
        width: 100%;

        @include r(600) {
            margin-right: 0;
            margin-top: -12rem;
            position: relative;
        }
        @include r(768) {
            margin-right: auto;
            margin-top: 0;
        }
    }

    .gapFocus {
        align-items: center;
        border-top: 1px solid $lightest;
        display: flex;
        margin: 4rem -3.2rem 0;
        padding: 3.2rem 3.2rem 0;
        width: calc(100% + 6.4rem);

        .flexIt {
            margin-left: 1.6rem;
        }
    }

    .gapActions {
        margin: 2rem 0;
    }


    .nogapContainer {
        @include shadowbox;
        background-color: lighten($dolphin, 5%);
        background-image: url(/assets/images/grainy.png),
        url(/assets/images/crosses2.svg),
        url(/assets/images/outlineBlob.svg),
        url(/assets/images/royalBlob.svg),
        url(/assets/images/pinkBlob5.svg);
        background-position: 0 0, 39rem -1rem, -34rem -84rem, -5rem 23rem, -17rem -32rem;
        background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;
        background-size: auto, 40%, 200%, 100%, 100%;
        color: $white;
        position: relative;

        h2 {
            margin-bottom: .4rem;
        }
    }


</style>