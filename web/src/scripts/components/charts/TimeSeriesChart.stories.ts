import Vue from "vue";
import TimeSeriesChart from "@components/charts/TimeSeriesChart.vue";
import {
    TimeSeriesConfig,
    createTickSettingsX,
    createTickSettingsY
} from "@web/charts/timeSeriesChart";
import { boolean, number, text } from "@storybook/addon-knobs";
import { TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";

export default {
    title: "Charts/TimeSeries"
}

export const Configurable = () => Vue.extend({
    template: `
      <div :style="{padding: '1rem'}">
      <time-series-chart chart-id="timeseries-1" :chart-data="data" :options="options"/>
      </div>`,
    components: {
        TimeSeriesChart,
    },
    props: {
        showYAxis: {
            default: boolean("Show Y Axis", true)
        },
        labelX: { default: text("Label X Axis", "") },
        labelY: { default: text("Label Y Axis", "") },
        fontSize: { default: number("Tick Font Size (px)", 12) },
    },
    computed: {
        data(): TimeSeriesDataPoint[] {
            let lastDate = new Date('2020-01-10')
            lastDate.setHours(0)
            lastDate.setMinutes(0)
            lastDate.setSeconds(0)
            return [
                { date: new Date('2020-01-01'), value: 0.5, label: "One" },
                { date: new Date('2020-01-02'), value: 0.43, label: "Two" },
                { date: new Date('2020-01-03'), value: 0.88, label: "Three" },
                { date: new Date('2020-01-04'), value: 0.95, label: "Four" },
                { date: new Date('2020-01-05'), value: 0.73, label: "Five" },
                { date: new Date('2020-01-06'), value: 0.81, label: "Six" },
                { date: new Date('2020-01-07'), value: 0.96, label: "Seven" },
                { date: new Date('2020-01-08'), value: 0.94, label: "Eight" },
                { date: new Date('2020-01-09'), value: 0.3, label: "Nine" },
                { date: lastDate, value: 0.6, label: "ten" },
                { date: new Date('2020-01-11'), value: 0.3, label: "Nine" },
            ]
        },
        options(): Partial<TimeSeriesConfig> {
            return {
                showYAxis: this.showYAxis,
                labels: {
                    x: this.labelX,
                    y: this.labelY,
                },
                ticks: {
                    x: createTickSettingsX({ fontSize: this.fontSize }),
                    y: createTickSettingsY({ fontSize: this.fontSize })
                }
            };
        }
    }
})