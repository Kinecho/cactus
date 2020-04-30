<template>
    <div class="radar-container">
        <h3>Radar Chart</h3>
        <div class="radar-chart" :id="chartId"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { Prop, Watch } from "vue-property-decorator";
    import { RadarChartDataPoint } from "@shared/charts/RadarChartData";
    import Logger from "@shared/Logger";
    import * as d3 from "d3";
    import uuid from "uuid/v4";

    const logger = new Logger("RadarChart");

    @Component
    export default class RadarChart extends Vue {
        name = "RadarChart";

        chartId = uuid();
        isMounted = false;

        @Prop({ type: Array as () => RadarChartDataPoint[], required: true })
        dataPoints!: RadarChartDataPoint[];


        mounted() {
            this.isMounted = true;
        }

        @Watch("dataPoints")
        drawChart() {
            if (!this.isMounted) {
                logger.info("Not mounted yet");
                return;
            }

            //remove any existing chart
            d3.select(`#${ this.chartId }`).select("svg").remove()

        }
    }
</script>

<style scoped lang="scss">

</style>