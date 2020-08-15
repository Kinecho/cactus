<template>
    <div>
        <h2>Positivity Rating</h2>
        <p class="subtext" v-if="locked">The positivity of your reflections over time. Reflect a few more times to reveal it.</p>
        <p class="subtext" v-else-if="empty">The positivity of your reflections over time. Reflect a few more times to reveal it.</p>
        <p class="subtext" v-else>The positivity of your reflections over time</p>
        <time-series-chart
                chart-id="insights-positivity-widget"
                :class="{locked}"
                :chart-data="actualData"
                :aspect-ratio="0.75"
                :options="options"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import { createMockPositivityData, TimeSeriesConfig, TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";
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

    @Prop({type: Boolean, required: false, default: false})
    empty!: boolean;

    get actualData(): TimeSeriesDataPoint[] {
        if (this.locked) {
            return createMockPositivityData()
        } else {
            return this.data;
        }
    }

    options: Partial<TimeSeriesConfig> = {
        showYAxis: false,
        fixedDateRange: true,
        ticks: {
            x: createTickSettingsX({ fontSize: 14, interval: 2 }),
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
  filter: blur(8px);
}
</style>