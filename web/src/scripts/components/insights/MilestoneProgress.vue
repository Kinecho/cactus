<template>
    <div class="streak">
        <span v-for="(milestone, index) in milestones" :class="{done: index < totalReflections}">
            <svg v-if="milestone.type === 'check'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <svg v-else-if="milestone.type === 'flag'" class="flag" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
        </span>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import { defaultMilestones, Milestone } from "@components/insights/MilestoneTypes";

const _milestones = defaultMilestones()

@Component
export default class MilestoneProgress extends Vue {
    name = "MilestoneProgress.vue";

    @Prop({ type: Number, default: 0, required: true })
    totalReflections!: number;

    @Prop({ type: Array as () => Milestone[], default: _milestones, required: false })
    milestones!: Milestone[]

}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";

.streak {
  display: flex;
  margin: 4rem 0 .8rem;

  span {
    align-items: center;
    background-color: $white;
    border-radius: 50%;
    display: flex;
    flex-shrink: 0;
    height: 3.6rem;
    justify-content: center;
    margin-right: .4rem;
    width: 3.6rem;

    @include r(374) {
      height: 4rem;
      width: 4rem;
    }
    @include r(768) {
      height: 4.8rem;
      margin-right: .8rem;
      width: 4.8rem;
    }
  }

  svg {
    height: 1.4rem;
    stroke: $white;
    width: 1.4rem;

    @include r(768) {
      height: 1.8rem;
      width: 1.8rem;
    }

    &.flag {
      opacity: .8;
      stroke: $royal;
    }
  }

  .done {
    background-color: $royal;

    .flag {
      opacity: 1;
      stroke: $white;
    }
  }
}

</style>