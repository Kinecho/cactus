import RadarChart from "@components/RadarChart.vue";
import Vue from "vue";
import { RadarChartData } from "@shared/charts/RadarChartData";
import { CactusElement } from "@shared/models/CactusElement";

export default {
    title: "Charts/Radar"
}

export const Simple = () => Vue.extend({
    template: `
        <div :style="{maxWidth: '300px'}">
            <radar-chart :chart-data="chartData" chart-id="simple-radar-1" :colors="colors"/>
        </div>`,
    components: { RadarChart },
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