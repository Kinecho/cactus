import Vue from "vue";
import TimeSeriesChart from "@components/charts/TimeSeriesChart.vue";
import {
    createTickSettingsX,
    createTickSettingsY
} from "@web/charts/timeSeriesChart";
import { boolean, number, text } from "@storybook/addon-knobs";
import { TimeSeriesConfig, TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";
import { DateTime } from "luxon";

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
            // let lastDate = new Date('2020-01-10')
            const startDate = DateTime.local(2020, 8, 4, 0, 0, 0, 0)
            // lastDate.setHours(0)
            // lastDate.setMinutes(0)
            // lastDate.setSeconds(0)
            return [
                { date: startDate.plus({ days: 0 }).toJSDate(), value: 0.5, label: "One" },
                { date: startDate.plus({ days: 1 }).toJSDate(), value: 0.5, label: "One" },
                { date: startDate.plus({ days: 2 }).toJSDate(), value: 0.43, label: "Two" },
                { date: startDate.plus({ days: 3 }).toJSDate(), value: 0.88, label: "Three" },
                { date: startDate.plus({ days: 4 }).toJSDate(), value: null, label: "Four" },
                { date: startDate.plus({ days: 5 }).toJSDate(), value: 0.73, label: "Five" },
                { date: startDate.plus({ days: 6 }).toJSDate(), value: null, label: "Six" },
                { date: startDate.plus({ days: 7 }).toJSDate(), value: 0.96, label: "Seven" },
                { date: startDate.plus({ days: 8 }).toJSDate(), value: 0.94, label: "Eight" },
                { date: startDate.plus({ days: 9 }).toJSDate(), value: 0.3, label: "Nine" },
                { date: startDate.plus({ days: 10 }).toJSDate(), value: 0.6, label: "ten" },
                { date: startDate.plus({ days: 11 }).toJSDate(), value: 0.3, label: "Nine" },
                { date: startDate.plus({ days: 12 }).toJSDate(), value: 0.3, label: "Nine" },
                { date: startDate.plus({ days: 13 }).toJSDate(), value: 0.3, label: "Nine" },
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