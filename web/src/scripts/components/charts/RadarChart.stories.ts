import RadarChart from "@components/charts/RadarChart.vue";
import Vue from "vue";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { CactusElement } from "@shared/models/CactusElement";
import { RadarChartConfig } from "@web/charts/radarChart";
import { boolean, color, number, text } from "@storybook/addon-knobs";
import { RGBToHex } from "@web/util";

export default {
    title: "Charts/Radar"
}

export const Configurable = () => Vue.extend({
    template: `
        <radar-chart :chart-data="chartData" chart-id="simple-radar-1" :options="options"/>
    `,
    components: { RadarChart },
    props: {
        color1: {
            default: color("Color 1", "#CC33A1", "Chart")
        },
        color2: {
            default: color("Color 2", "#6590ED", "Chart")
        },
        roundedLines: {
            default: boolean("Rounded Lines", true, "Chart"),
        },
        showLegend: {
            default: boolean("Show Legend", false, "Legend"),
        },
        legendTitle: {
            default: text("Legend Title", "Legend", "Legend")
        },
        legendOffsetX: {
            default: number("Legend Offset X", -120, undefined, "Legend")
        },
        legendOffsetY: {
            default: number("Legend Offset Y", 300, undefined, "Legend")
        },
        chartPaddingTop: {
            default: number("Padding Top (px)", 10, undefined, "Chart"),
        },
        chartPaddingLeft: {
            default: number("Padding Left (px)", 10, undefined, "Chart"),
        },
        chartPaddingRight: {
            default: number("Padding Right (px)", 10, undefined, "Chart"),
        },
        chartPaddingBottom: {
            default: number("Padding Bottom (px)", 10, undefined, "Chart"),
        },
        fontSize: {
            default: number("Font Size", 12, undefined, "Chart"),
        },
        showLabels: {
            default: boolean("Show Labels", false, "Chart"),
        }
    },
    computed: {
        options(): Partial<RadarChartConfig> {
            const opts: Partial<RadarChartConfig> = {
                legend: this.showLegend,
                colorValues: [RGBToHex(this.color1), RGBToHex(this.color2)],
                margin: {
                    top: this.chartPaddingTop,
                    bottom: this.chartPaddingBottom,
                    left: this.chartPaddingLeft,
                    right: this.chartPaddingRight
                },
                roundStrokes: this.roundedLines,
                fontSizePx: this.fontSize,
                showLabels: this.showLabels,
            };

            if (this.showLegend) {
                opts.legend = {
                    title: this.legendTitle,
                    translateX: this.legendOffsetX,
                    translateY: this.legendOffsetY
                }
            }


            console.log("opts", opts);
            return opts;
        }
    },
    data(): {
        chartData: RadarChartData[],
        colors: string[],
    } {
        return {
            colors: ["purple", "green"],
            chartData: [{
                name: "Importance",
                axes:
                [
                    { value: 2, axis: CactusElement.emotions },
                    { value: 3, axis: CactusElement.energy },
                    { value: 4, axis: CactusElement.experience },
                    { value: 4, axis: CactusElement.meaning },
                    { value: 4, axis: CactusElement.relationships },
                ]
            }, {
                name: "Satisfaction",
                axes: [
                    { value: 5, axis: CactusElement.emotions },
                    { value: 3, axis: CactusElement.energy },
                    { value: 3, axis: CactusElement.experience },
                    { value: 1, axis: CactusElement.meaning },
                    { value: 4, axis: CactusElement.relationships },
                ]
            }]
        }
    }
})