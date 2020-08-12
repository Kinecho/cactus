import Vue from "vue";
import TimeSeriesChart from "@components/charts/TimeSeriesChart.vue";
import { TimeSeriesConfig, TimeSeriesDataPoint } from "@web/charts/timeSeriesChart";
import { boolean, text } from "@storybook/addon-knobs";

export default {
    title: "Charts/TimeSeries"
}

export const Configurable = () => Vue.extend({
    template: `
      <time-series-chart chart-id="timeseries-1" :chart-data="data" :options="options"/>`,
    components: {
        TimeSeriesChart,
    },
    props: {
        showYAxis: {
            default: boolean("Show Y Axis", true)
        },
        labelX: { default: text("Label X Axis", "Date") },
        labelY: { default: text("Label Y Axis", "Score") }
    },
    computed: {
        data(): TimeSeriesDataPoint[] {
            return [
                { date: new Date('2020-01-01'), value: 0.5, label: "One" },
                { date: new Date('2020-01-02'), value: 0.43, label: "Two" },
                // { date: new Date('2020-01-03'), value: 0.88, label: "Three" },
                { date: new Date('2020-01-04'), value: 0.95, label: "Four" },
                { date: new Date('2020-01-05'), value: 0.73, label: "Five" },
                // { date: new Date('2020-01-06'), value: 0.81, label: "Six" },
                { date: new Date('2020-01-07'), value: 0.96, label: "Seven" },
                { date: new Date('2020-01-08'), value: 0.94, label: "Eight" },
            ]
        },
        options(): Partial<TimeSeriesConfig> {
            return {
                showYAxis: this.showYAxis,
                labels: {
                    x: this.labelX,
                    y: this.labelY,
                }
            };
        }
    }
})