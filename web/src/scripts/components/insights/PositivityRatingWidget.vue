<template>
    <div>
        <h2>Positivity Rating</h2>
        <p class="subtext" v-if="locked">The positivity of your reflections over time. Reflect a few more times to
            reveal it.</p>
        <p class="subtext" v-else>The positivity of your reflections over time</p>
        <time-series-chart
                chart-id="insights-positivity-widget"
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
import { TimeSeriesConfig, TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";
import TimeSeriesChart from "@components/charts/TimeSeriesChart.vue";
import { createTickSettingsX, createTickSettingsY} from "@web/charts/timeSeriesChart";

@Component({
    components: {
        TimeSeriesChart
    }
})
export default class PositivityRatingWidget extends Vue {
    name = "PositivityRatingWidget";

    @Prop({ type: Array as () => TimeSeriesDataPoint[], required: false, default: [] })
    data!: TimeSeriesDataPoint[];

    @Prop({ type: Boolean, required: false, default: false })
    locked!: boolean;

    options: Partial<TimeSeriesConfig> = {
        showYAxis: true,
        ticks: {
            x: createTickSettingsX({ fontSize: 14 }),
            y: createTickSettingsY({ fontSize: 14 })
        }
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