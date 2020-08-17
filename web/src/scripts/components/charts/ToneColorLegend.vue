<template>
    <ul class="tone-legend">
        <li class="tone" v-for="item in legend">
            <span class="color" :style="{background: item.color}"></span>
            <span class="label">{{ item.label }}</span>
        </li>
    </ul>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { getToneDisplayName, ToneColorMap, ToneID } from "@shared/api/ToneAnalyzerTypes";
import { Prop } from "vue-property-decorator";


interface Legend {
    color: string,
    label: string,
}

@Component({
    components: {}
})
export default class ToneColorLegend extends Vue {
    name = "ToneColorLegend";

    @Prop({ type: Array as () => ToneID[], required: false, default: Object.keys(ToneID) as ToneID[] })
    toneIds!: ToneID[];

    get legend(): Legend[] {
        return this.toneIds.filter(id => id !== ToneID.unknown).map(id => {
            return {
                color: ToneColorMap[id],
                label: getToneDisplayName(id)
            }
        })
    }
}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";

.tone-legend {
  list-style: none;

  .tone {
    display: flex;
    align-content: center;
    align-items: center;
  }

  .color {
    width: 1rem;
    height: 1rem;
    margin-right: 1rem;
    border-radius: 50%;
  }
}
</style>