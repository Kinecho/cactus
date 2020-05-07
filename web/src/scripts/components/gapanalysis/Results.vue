<template>
    <div>
        <cactus-confetti :running="showConfetti"/>
        <div class="row top">
            <cactus-element element="emotions" class="element" @selected="elementClicked" :selected="selectedElement === 'emotions'"/>

        </div>
        <div class="row middle">
            <cactus-element element="relationships" class="element" @selected="elementClicked" :selected="selectedElement === 'relationships'"/>
            <radar-chart :chart-data="results.chartData" chart-id="assessment-1" :options="options"/>
            <cactus-element element="energy" class="element" @selected="elementClicked" :selected="selectedElement === 'energy'"/>
        </div>
        <div class="row bottom">
            <cactus-element element="meaning" class="element" @selected="elementClicked" :selected="selectedElement === 'meaning'"/>
            <cactus-element element="experience" class="element" @selected="elementClicked" :selected="selectedElement === 'experience'"/>
        </div>

        <button @click="done">Done</button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusConfetti from "@components/CactusConfetti.vue";
    import Component from "vue-class-component";
    import RadarChart from "@components/RadarChart.vue";
    import { Prop } from "vue-property-decorator";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import CactusElement from "@components/gapanalysis/CactusElement.vue";
    import { RadarChartConfig } from "@web/charts/radarChart";

    @Component({
        components: {
            CactusElement,
            CactusConfetti,
            RadarChart,
        }
    })
    export default class Results extends Vue {

        @Prop({ type: Boolean, default: true })
        showConfetti: boolean = true;

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        results!: GapAnalysisAssessmentResult;

        @Prop({ type: Object as () => Partial<RadarChartConfig>, required: false })
        chartOptions?: Partial<RadarChartConfig>

        selectedElement: CactusElement | string | null = null;

        async done() {
            this.$emit('done')
        }

        elementClicked(element: CactusElement | undefined) {
            if (this.selectedElement === element) {
                this.selectedElement = null;
            }
            this.selectedElement = element ?? null;
        }

        get options(): Partial<RadarChartConfig> {
            return {
                margin: {
                    top: 10,
                    left: 10,
                    right: 10,
                    bottom: 10,
                },
                legend: false,

                ...this.chartOptions
            }
        }
    }
</script>

<style scoped lang="scss">
    .row {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;

        .element {

        }

        &.middle {
            .element {
                transform: translateY(-4rem);
                flex-basis: 20%;
            }
        }

        &.bottom {
            justify-content: center;
            align-items: center;

            .element {
                flex-basis: 25%;
            }
        }
    }
</style>