<template>
    <div>
        <h2>Emotions</h2>
        <p class="subtext" v-if="locked">Reflect a few more times to reveal the emotions in your writing over
            time.</p>
        <p class="subtext" v-else>The emotions revealed in your reflections over time</p>
        <stacked-bar-chart
                chart-id="emotions-chart-widget"
                :class="{locked}"
                :chart-data="data"
                :aspect-ratio="0.75"
                :options="options"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import { BarChartDataPoint, StackedBarChartOptions } from "@shared/charts/StackedBarChartTypes";
import StackedBarChart from "@components/charts/StackedBarChart.vue";

@Component({
    components: {
        StackedBarChart
    }
})
export default class EmotionsBarChartWidget extends Vue {
    name = "EmotionsBarChartWidget";

    @Prop({ type: Array as () => BarChartDataPoint<Date>[], required: false, default: [] })
    data!: BarChartDataPoint<Date>[];

    @Prop({ type: Boolean, required: false, default: false })
    locked!: boolean;

    options: StackedBarChartOptions = {
        showYAxis: false,

    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";
@import "insights";

.locked {
  filter: blur(5px);
}
</style>