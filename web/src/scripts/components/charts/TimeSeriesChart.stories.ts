import Vue from "vue";
import TimeSeriesChart from "@components/charts/TimeSeriesChart.vue";
import { TimeSeriesConfig, TimeSeriesDataPoint } from "@web/charts/timeSeriesChart";

export default {
    title: "Charts/TimeSeries"
}

export const Configurable = () => Vue.extend({
    template: `<time-series-chart chart-id="timeseries-1" :chart-data="data" :options="options"/>`,
    components: {
        TimeSeriesChart,
    },
    computed: {
        data(): TimeSeriesDataPoint[] {
            return [
                {date: new Date('2020-01-01'), value: 1, label: "One"},
                {date: new Date('2020-01-02'), value: 3, label: "Two"},
                {date: new Date('2020-01-03'), value: 2, label: "Three"},
                {date: new Date('2020-01-04'), value: 6, label: "Four"},
                {date: new Date('2020-01-05'), value: 5, label: "Five"},
            ]
        },
        options(): Partial<TimeSeriesConfig> {
            return {};
        }
    }
})