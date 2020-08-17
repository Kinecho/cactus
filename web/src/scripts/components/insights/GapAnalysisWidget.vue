<template>
    <section v-if="isPlusMember && gapAssessmentResults" class="gapContainer">
        <h2>Happiness Quiz</h2>
        <div class="flexIt">
            <div class="textContainer">
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
                        :showElementImages="true"
                        :showLegend="false"
                />
                <div class="legend">
                    <gap-analysis-legend/>
                </div>
            </div>
        </div>
        <div v-if="selectFocusEnabled" class="gapActions">
            <p>Tap an element to choose a focus.</p>
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
    <router-link v-else-if="isPlusMember" tag="section" class="plus nogapContainer" :to="gapAssessmentHref">
        <h2>What Makes You Happy?</h2>
        <p class="subtext">Understand what contributes to (and detracts from) your satisfaction.</p>
        <router-link tag="button" class="secondary esButton" :to="gapAssessmentHref">Take the Quiz</router-link>
    </router-link>
    <!-- Show BASIC User Upgrade message -->
    <router-link v-else-if="!isPlusMember" tag="section" class="basic nogapContainer" :to="gapAssessmentHref">
        <svg class="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <h2>What Makes You Happy?</h2>
        <p class="subtext">Understand what contributes to (and detracts from) your satisfaction.</p>
    </router-link>
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
    import SvgIcon from "@components/SvgIcon.vue";

    @Component({
        components: {
            DropdownMenu,
            Results,
            GapAnalysisLegend,
            SvgIcon,
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
        border: 1px solid $lightest;
        border-radius: 1.6rem;
        margin: 0 2.4rem 3.2rem;
        padding: 2.4rem 2.4rem 0;
        position: relative;

        @include r(374) {
            margin: 0 0 3.2rem;
            padding: 2.4rem 3.2rem 0;
        }
        @include r(960) {
            flex-basis: 50%;
            margin-bottom: 4.8rem;
            margin-right: 1.6rem;
        }
    }

    .flexIt {
        @include r(960) {
            align-items: center;
            display: flex;
            justify-content: space-between;
        }
    }

    .textContainer {
        .legend {
            display: none;
        }

        @include r(960) {
            padding-right: 1.6rem;

            .legend {
                display: flex;
            }
        }
    }

    h2 {
        margin-bottom: 3.2rem;

        @include r(960) {
            margin-bottom: 0;
        }
    }

    .gapFocus {
        margin-bottom: 2.4rem;

        @include r(960) {
            margin-bottom: 0;
        }
    }

    .radarChartContainer {
        margin: 0 auto;
        max-width: 38rem;
        width: 100%;

        .legend {
            margin-bottom: 3.2rem;
        }

        @include r(960) {
            margin: 0;
            width: 66%;

            .legend {
                display: none;
            }
        }
    }

    .gapContainer,
    .nogapContainer {
        margin: 0 2.4rem 3.2rem;

        @include r(374) {
            margin: 0 0 3.2rem;
        }
        @include r(768) {
            margin: 0;
        }
    }

    .nogapContainer {
        cursor: pointer;
        position: relative;

        &.plus {
            background-color: $royal;
            background-image: url(/assets/images/grainy.png), url(/assets/images/radarChartGraphicGreen.svg);
            background-position: 0 0, right -17rem bottom -9rem;
            background-repeat: repeat, no-repeat;
            background-size: 10rem, 43rem;
            border-radius: 1.6rem;
            color: $white;
            padding: 2.4rem 3.2rem 3.2rem;

            @include r(600) {
                transition: box-shadow .3s, transform .3s ease-in;

                &:hover {
                    box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.012),
                        0 11.5px 32.3px -24px rgba(0, 0, 0, 0.036),
                        0 13.9px 37.7px -24px rgba(0, 0, 0, 0.074),
                        0 24px 63px -24px rgba(0, 0, 0, 0.15);
                    transform: translateY(-.2rem);
                }

                .subtext {
                    font-size: 1.8rem;
                }

                .subtext + button {
                    display: block;
                    margin-top: 2.4rem;
                    width: auto;
                }

                button:hover {
                    background-color: $white;
                }
            }

            button {
                display: none;
            }
        }

        &.basic {
            background-color: $royal;
            background-image: url(/assets/images/grainy.png), url(/assets/images/radarChartGraphicGreen.svg);
            background-position: 0 0, right -11rem center;
            background-repeat: repeat, no-repeat;
            background-size: 16rem, 19rem;
            border-radius: 1.6rem;
            color: $white;
            padding: 5.6rem 3.2rem 3.2rem 2.4rem;

            @include r(600) {
                transition: box-shadow .3s, transform .3s ease-in;

                &:hover {
                    box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.012),
                        0 11.5px 32.3px -24px rgba(0, 0, 0, 0.036),
                        0 13.9px 37.7px -24px rgba(0, 0, 0, 0.074),
                        0 24px 63px -24px rgba(0, 0, 0, 0.15);
                    transform: translateY(-.2rem);
                }
            }
        }

        h2 {
            line-height: 1.2;
            margin-bottom: .8rem;
        }
    }

    .esButton {
        width: 100%;

        @include r(768) {
            width: auto;
        }
    }

</style>
