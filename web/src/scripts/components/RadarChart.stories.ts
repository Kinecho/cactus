import RadarChart from "@components/RadarChart.vue";
import Vue from "vue";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { CactusElement } from "@shared/models/CactusElement";
import { RadarChartConfig } from "@web/charts/radarChart";
import { boolean, color, number, text } from "@storybook/addon-knobs";
import { RGBToHex } from "@web/util";

export default {
    title: "Charts/Radar"
}

export const Simple = () => Vue.extend({
    template: `
        <div :style="{width: containerWidth + 'px', height: containerHeight + 'px', border: '1px solid black', display: 'flex', justifyContent: 'center', alignItems: 'center'}">
            <radar-chart :chart-data="chartData" chart-id="simple-radar-1" :options="options"/>
        </div>`,
    components: { RadarChart },
    props: {
        color1: {
            default: color("Color 1", "#CC33A1", "Chart")
        },
        color2: {
            default: color("Color 2", "#6590ED", "Chart")
        },
        showLegend: {
            default: boolean("Show Legend", true, "Chart"),
        },
        legendTitle: {
            default: text("Legend Title", "Legend", "Chart")
        },
        legendOffsetX: {
            default: number("Legend Offset X", -120, undefined, "Chart")
        },
        legendOffsetY: {
            default: number("Legend Offset Y", 260, undefined, "Chart")
        },
        circleDiameter: {
            default: number("Circle Diameter (px)", 200, undefined, "Chart")
        },
        chartPaddingTop: {
            default: number("Padding Top (px)", 60, undefined, "Chart"),
        },
        chartPaddingLeft: {
            default: number("Padding Left (px)", 60, undefined, "Chart"),
        },
        chartPaddingRight: {
            default: number("Padding Right (px)", 60, undefined, "Chart"),
        },
        chartPaddingBottom: {
            default: number("Padding Bottom (px)", 100, undefined, "Chart"),
        },
        containerWidth: {
            default: number("Width", 400, undefined, "Container"),
        },
        containerHeight: {
            default: number("Height", 400, undefined, "Container"),
        },
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
                w: this.circleDiameter,
                h: this.circleDiameter,
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