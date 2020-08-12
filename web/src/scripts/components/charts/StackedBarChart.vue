<template>
    <div class="stacked-bar-container">
        <div class="stacked-bar-chart" :class="chartId"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Logger from "@shared/Logger";
import { debounce } from "debounce";
import { BarChartDataPoint, StackedBarChartOptions } from "@shared/charts/StackedBarChartTypes";
import { drawStackedBarChart } from "@web/charts/stackedBarChart";

const logger = new Logger("TimeseriesChart");

const margin = { top: 0, right: 0, bottom: 0, left: 0 },
width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
height = Math.min(700, window.innerHeight - margin.top - margin.bottom);

@Component
export default class StackedBarChart extends Vue {
    @Prop({ type: Object as () => StackedBarChartOptions, default: {}, required: false })
    options!: StackedBarChartOptions;

    @Prop({ type: Array as () => BarChartDataPoint[], required: true })
    chartData!: BarChartDataPoint[];

    @Prop({ type: String, required: true })
    xAxis!: string;

    @Prop({ type: String, required: true })
    chartId!: string;

    @Prop({ type: Number, required: false, default: 0.75 })
    aspectRatio!: number;

    name = "StackedBarChart";
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
        const width = Math.max(this.chartWidth, 300);
        logger.info("Custom options", this.options)

        drawStackedBarChart(`.${ this.chartId }`,
            this.chartData,
            {
                ...(this.options ?? {}),
                w: width,
                h: width * this.aspectRatio,
            });
    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";

.stacked-bar-chart {
  font-family: $font-stack;
  border: 2px solid red;
}
</style>