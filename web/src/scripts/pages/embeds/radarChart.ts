import Vue from "vue";
import RadarChart from "@components/charts/RadarChart.vue";

new Vue({
    template: `
    <div>
        <h1>Radar Chart</h1>
    </div>
        
    `,
    components: {
        RadarChart,
    }
}).$mount("#app");