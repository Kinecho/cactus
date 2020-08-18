<template>
    <div class="radar-container">
        <div class="radar-chart" :class="chartId"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { RadarChartData } from "@shared/charts/RadarChartData";
import Logger from "@shared/Logger";
import * as d3 from "d3";
import { drawRadarChartD3, RadarChartConfig } from "@web/charts/radarChart";
import { debounce } from "debounce";

const logger = new Logger("RadarChart");

    const margin = { top: 100, right: 100, bottom: 100, left: 100 },
    width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
    height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

    const color = d3.scaleOrdinal()
    .range(["#EDC951", "#CC333F", "#00A0B0"]);


    // const radarChartOptions = {
    //     w: width,
    //     h: height,
    //     margin: margin,
    //     maxValue: 0.5,
    //     levels: 5,
    //     roundStrokes: true,
    //     color: color
    // };
    //
    // const cfg = {
    //     w: 600,				//Width of the circle
    //     h: 600,				//Height of the circle
    //     margin: { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
    //     levels: 3,				//How many levels or inner circles should there be drawn
    //     maxValue: 0, 			//What is the value that the biggest circle will represent
    //     labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
    //     wrapWidth: 120, 		//The number of pixels after which a label needs to be given a new line
    //     opacityArea: 0.35, 	//The opacity of the area of the blob
    //     dotRadius: 4, 			//The size of the colored circles of each blog
    //     opacityCircles: 0.1, 	//The opacity of the circles of each blob
    //     strokeWidth: 2, 		//The width of the stroke around each blob
    //     roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
    //     // color: d3.scaleBand().category10()	//Color function
    //     color: d3.scaleOrdinal(d3.schemeCategory10),
    // };

    @Component
    export default class RadarChart extends Vue {
        name = "RadarChart";

        isMounted = false;

        @Prop({ type: Object as () => Partial<RadarChartConfig>, default: undefined, required: false })
        options: Partial<RadarChartConfig> | undefined;

        @Prop({ type: Array as () => RadarChartData[], required: true })
        chartData!: RadarChartData[];

        @Prop({ type: Array as () => string[], required: false })
        colors?: string[];

        @Prop({ type: String, required: true })
        chartId!: string;

        debounceHandler: (() => void) | null = null;

        chartDiameter = 200;

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

            drawRadarChartD3(`.${ this.chartId }`,
            this.chartData,
            {
                ...this.options ?? {},
                w: Math.max(this.chartDiameter, 50),
                h: Math.max(this.chartDiameter, 50),
            });
        }
    }
</script>

<style scoped lang="scss">

</style>