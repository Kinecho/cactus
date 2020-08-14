<template>
    <div>
        <h2>Emotions</h2>
        <p class="subtext" v-if="locked">Reflect a few more times to reveal the emotions in your writing over time.</p>
        <p class="subtext" v-else-if="empty">Reflect a few more times to reveal the emotions in your writing over time.</p>
        <p class="subtext" v-else>The emotions revealed in your reflections over time</p>
        <stacked-bar-chart
                chart-id="emotions-chart-widget"
                :class="{locked}"
                :chart-data="actualData"
                :aspect-ratio="0.75"
                :options="options"/>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import { BarChartDataPoint, mockEmotionsData, StackedBarChartOptions } from "@shared/charts/StackedBarChartTypes";
import StackedBarChart from "@components/charts/StackedBarChart.vue";

@Component({
    components: {
        StackedBarChart
    }
})
export default class EmotionsBarChartWidget extends Vue {
    name = "EmotionsBarChartWidget";

    @Prop({ type: Array as () => BarChartDataPoint<Date>[], required: false, default: [] })
    data!: BarChartDataPoint<Date>[];

    @Prop({ type: Boolean, required: false, default: false })
    locked!: boolean;

    @Prop({type: Boolean, required: false, default: false})
    empty!: boolean;

    get actualData(): BarChartDataPoint<Date>[] {
        if (this.locked) {
            return mockEmotionsData();
        } else {
            return this.data;
        }
    }

    options: StackedBarChartOptions = {
        showYAxis: false,

        ticks: {
            every: 2,
        }
    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";
@import "insights";

.locked {
  filter: blur(8px);
}
</style>