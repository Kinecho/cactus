<template>
    <div class="timeseries-container">
        <p>IsMounted = {{ isMounted }}</p>
        <p>Chart Diameter = {{ chartDiameter }}</p>
        <div class="timeseries-chart" :class="chartId"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Logger from "@shared/Logger";
import { debounce } from "debounce";
import { drawTimeSeriesChart, TimeSeriesConfig, TimeSeriesDataPoint } from "@web/charts/timeSeriesChart";

const logger = new Logger("TimeseriesChart");

const margin = { top: 0, right: 0, bottom: 0, left: 0 },
width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
height = Math.min(700, window.innerHeight - margin.top - margin.bottom);

@Component
export default class TimeSeriesChart extends Vue {
    name = "TimeSeriesChart";

    isMounted = false;

    @Prop({ type: Object as () => Partial<TimeSeriesConfig>, default: undefined, required: false })
    options: Partial<TimeSeriesConfig> | undefined;

    @Prop({ type: Array as () => TimeSeriesDataPoint[], required: true })
    chartData!: TimeSeriesDataPoint[];

    // @Prop({ type: Array as () => string[], required: false })
    // colors?: string[];

    @Prop({ type: String, required: true })
    chartId!: string;

    debounceHandler: (() => void) | null = null;

    chartDiameter = 400;

    mounted() {
        this.isMounted = true;
        this.debounceHandler = debounce(this.onResize)
        window.addEventListener("resize", this.debounceHandler);
        this.onResize();
    }

    onResize() {
        this.chartDiameter = this.$el.getBoundingClientRect().width;
        this.drawChart();
    }


    @Watch("dataPoints")
    dataPointsChanged() {
        this.drawChart()
    }

    @Watch("options")
    optionsChanged() {
        this.drawChart();
    }

    drawChart() {
        if (!this.isMounted) {
            logger.info("Not mounted yet");
            return;
        }
        logger.info("Drawing chart");
        drawTimeSeriesChart(`.${ this.chartId }`,
        this.chartData,
        {
            ...this.options ?? {},
            w: Math.max(this.chartDiameter, 300),
            h: Math.max(this.chartDiameter, 300),
        });
    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";

.timeseries-chart {
  border: 2px solid red;
  height: 500px;

  font-family: $font-stack;

}
</style>