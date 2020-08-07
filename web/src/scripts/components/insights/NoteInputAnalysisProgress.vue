<template>
    <div>
        <svg class="textAreaProgress" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle class="circleBg" cx="16" cy="16" r="14" stroke="black" stroke-width="4" stroke-opacity="10%"/>
            <circle class="circleProgress" cx="16" cy="16" r="14" stroke="#33CCAB" stroke-width="4" :style="styles"/>
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

    get styles(): Record<string, any> {
        let percent =  (this.input ?? "").length / 100;
        const maxRem = 9.6;
        const offsetRems = Math.min(maxRem, maxRem * percent);
        const rems = maxRem - offsetRems
        console.log("Setting rems to", rems, `${percent}%`)
        return {
            strokeDasharray: `${ rems }rem`,
            strokeDashoffset: `${ rems }rem`,
        }
    }
}
</script>

<style scoped lang="scss">
@import "mixins";
@import "variables";

.textAreaProgress {
  $diameter: 2.4rem;
  //bottom: 1.6rem;
  //display: none;
  height: $diameter;
  //position: absolute;
  //right: 1.6rem;
  transform: rotate(-90deg);
  width: $diameter;

  @include r(768) {
    bottom: 1.8rem;
  }
  @include r(960) {
    bottom: 2.4rem;
  }

  //.writeSomething:focus + & {
  //  display: block;
  //}

  .circleProgress {
    //animation: html 1s ease-out forwards;
    //stroke-dasharray: $diameter * 4;
    stroke-dashoffset: $diameter * 4;
  }
}
</style>