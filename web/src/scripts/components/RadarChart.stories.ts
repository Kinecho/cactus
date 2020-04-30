import RadarChart from "@components/RadarChart.vue";
import Vue from "vue";
import { RadarChartDataPoint } from "@shared/charts/RadarChartData";

export default {
    title: "Charts/Radar"
}

export const Simple = () => Vue.extend({
    template: `
        <radar-chart :data-points="dataPoints"/>`,
    components: { RadarChart },
    data(): {
        dataPoints: RadarChartDataPoint[]
    } {
        return {
            dataPoints: [
                { value: 0.2, axis: "Home" },
                { value: 0.3, axis: "Home" },
                { value: 0.4, axis: "Energy" }
            ]
        }
    }
})