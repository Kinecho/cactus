<template>
    <div>
        <svg class="textAreaProgress" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle class="circleBg" cx="16" cy="16" :r="circleRadius" stroke="black" stroke-width="4" stroke-opacity="10%"/>
            <circle class="circleProgress" cx="16" cy="16" :r="circleRadius" stroke="#33CCAB" stroke-width="4" :style="progressStyles" ref="circle"/>
        </svg>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";

@Component({
    components: {}
})
export default class NoteInputAnalysisProgress extends Vue {
    name = "NoteInputAnalysisProgress";

    @Prop({ type: String, required: false, default: null })
    input!: string | null;

    @Prop({ type: Number, required: false, default: 200 })
    characterThreshold!: number;

    circleRadius: number = 14;

    get progressStyles(): Record<string, any> {
        const percent = Math.min(1, (this.input ?? "").length / this.characterThreshold);
        const circumference = this.circleRadius * 2 * Math.PI;
        const offset = Math.max(0, circumference - circumference * percent)
        return {
            strokeDashoffset: `${ offset }`,
            strokeDasharray: `${ circumference } ${ circumference }`
        }
    }
}
</script>

<style scoped lang="scss">
@import "mixins";
@import "variables";

.textAreaProgress {
  $diameter: 2.4rem;
  height: $diameter;
  width: $diameter;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;

  @include r(768) {
    bottom: 1.8rem;
  }
  @include r(960) {
    bottom: 2.4rem;
  }
}
</style>