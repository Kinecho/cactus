<template>
    <div class="timeseries-container">
        <div class="timeseries-chart" :class="chartId"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Logger from "@shared/Logger";
import { debounce } from "debounce";
import { drawTimeSeriesChart} from "@web/charts/timeSeriesChart";
import { TimeSeriesConfig, TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";

const logger = new Logger("TimeseriesChart");

const margin = { top: 0, right: 0, bottom: 0, left: 0 },
width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
height = Math.min(700, window.innerHeight - margin.top - margin.bottom);

@Component
export default class TimeSeriesChart extends Vue {
    @Prop({ type: Object as () => Partial<TimeSeriesConfig>, default: null, required: false })
    options!: Partial<TimeSeriesConfig> | null;

    @Prop({ type: Array as () => TimeSeriesDataPoint[], required: true })
    chartData!: TimeSeriesDataPoint[];

    @Prop({ type: String, required: true })
    chartId!: string;

    @Prop({ type: Number, required: false, default: 0.75 })
    aspectRatio!: number;

    name = "TimeSeriesChart";
    isMounted = false;
    debounceHandler: (() => void) | null = null;
    chartWidth = 400;

    mounted() {
        this.isMounted = true;
        this.debounceHandler = debounce(this.onResize)
        window.addEventListener("resize", this.debounceHandler);
        this.onResize();
    }

    onResize() {
        this.chartWidth = this.$el.getBoundingClientRect().width;
        this.drawChart();
    }


    @Watch("chartData")
    onChartData() {
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
        const width = Math.max(this.chartWidth, 300);
        drawTimeSeriesChart(`.${ this.chartId }`,
        this.chartData,
        {
            ...this.options ?? {},
            w: width,
            h: width * this.aspectRatio,
        });
    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";

.timeseries-chart {
  font-family: $font-stack;
}
</style>