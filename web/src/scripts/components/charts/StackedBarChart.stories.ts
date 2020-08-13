import Vue from "vue";
import StackedBarChart from "@components/charts/StackedBarChart.vue";
import { boolean, number, text } from "@storybook/addon-knobs";
import { BarChartDataPoint, StackedBarChartOptions } from "@shared/charts/StackedBarChartTypes";
import { DateTime } from "luxon";

export default {
    title: "Charts/Stacked Bar Chart"
}


export const Default = () => Vue.extend({
    template: `
      <div>
      <stacked-bar-chart :chart-data="data" :options="options" chart-id="bar-chart-1" x-axis="year"/>
      </div>`,
    components: {
        StackedBarChart
    },
    props: {
        showYAxis: {
            default: boolean("Show Y Axis", true)
        },
        labelX: { default: text("Label X Axis", "") },
        labelY: { default: text("Label Y Axis", "") },
        fontSize: { default: number("Tick Font Size (px)", 12) },
        fixedBarWidth: { default: boolean("Fixed Bar Width", true) },
        barWidth: { default: number("Bar Width", 15) },
    },
    computed: {
        data(): BarChartDataPoint<Date>[] {

            return [
                {
                    x: DateTime.local(2020, 8, 1).toJSDate(),
                    series: { redDelicious: 10 }
                },
                {
                    x: DateTime.local(2020, 8, 2).toJSDate(),
                    series: { redDelicious: 12, pears: 4 }
                },
                {
                    x: DateTime.local(2020, 8, 3).toJSDate(),
                    series: { redDelicious: 5, mcintosh: 20, oranges: 8, pears: 2 }
                },
                {
                    x: DateTime.local(2020, 8, 5).toJSDate(),
                    series: { redDelicious: 1, mcintosh: 15, oranges: 5, pears: 4 }
                },
                {
                    x: DateTime.local(2020, 8, 5).toJSDate(),
                    series: { redDelicious: 2, mcintosh: 10, oranges: 4, pears: 2 }
                },
                {
                    x: DateTime.local(2020, 8, 6).toJSDate(),
                    series: { redDelicious: 3, mcintosh: 12, oranges: 6, pears: 3 }
                },
                // { x: new Date("2012-01-01"), series: {redDelicious: 4, mcintosh: 15, oranges: 8, pears: 1 }},
                // { x: new Date("2013-01-01"), series: {redDelicious: 6, mcintosh: 11, oranges: 9, pears: 4 }},
                // { x: new Date("2014-01-01"), series: {redDelicious: 10, mcintosh: 13, oranges: 9, pears: 5 }},
                // { x: new Date("2015-01-01"), series: {redDelicious: 16, mcintosh: 19, oranges: 6, pears: 9 }},
                // { x: new Date("2016-01-01"), series: {redDelicious: 19, mcintosh: 17, oranges: 5, pears: 7 }},
            ]
        },
        options(): StackedBarChartOptions {
            return {
                showYAxis: this.showYAxis,
                margin: {
                    left: 30,
                    top: 0,
                    bottom: 20,
                    right: 30
                },
                barWidth: this.fixedBarWidth ? this.barWidth : null,
            };
        }
    }
})