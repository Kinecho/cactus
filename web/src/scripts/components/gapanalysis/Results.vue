<template>
    <div>
        <cactus-confetti :running="showConfetti"/>
        <radar-chart :chart-data="results.chartData" chart-id="assessment-1"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusConfetti from "@components/CactusConfetti.vue";
    import Component from "vue-class-component";
    import RadarChart from "@components/RadarChart.vue";
    import { Prop } from "vue-property-decorator";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";

    @Component({
        components: {
            CactusConfetti,
            RadarChart,
        }
    })
    export default class Results extends Vue {

        @Prop({ type: Boolean, default: true })
        showConfetti: boolean = true;

        @Prop({ type: Object as () => GapAnalysisAssessmentResult, required: true })
        results!: GapAnalysisAssessmentResult;

    }
</script>

<style scoped lang="scss">

</style>