import Vue from "vue";
import StackedBarChart from "@components/charts/StackedBarChart.vue";
import { boolean, number, text } from "@storybook/addon-knobs";
import { BarChartDataPoint, mockEmotionsData, StackedBarChartOptions } from "@shared/charts/StackedBarChartTypes";
import { DateTime } from "luxon";
import { ToneID } from "@shared/api/ToneAnalyzerTypes";

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
            return mockEmotionsData()
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