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
        display: grid;
        /* autoprefixer: off */
        grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
        grid-template-rows: auto;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .tone {
        align-items: center;
        display: flex;
        padding: .4rem 1.2rem .4rem 0;
    }

    .color {
        border-radius: 50%;
        height: 1.2rem;
        margin-right: .4rem;
        width: 1.2rem;
    }

    .label {
        color: $lightText;
        font-size: 1.4rem;
    }
</style>