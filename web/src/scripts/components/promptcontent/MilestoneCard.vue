<template>
    <div class="milestone-card">
        <div>
            <h2>
                <markdown-text :source="message.title"/>
            </h2>
            <p>
                <markdown-text :source="message.message"/>
            </p>
            <milestone-progress :total-reflections="totalReflections"/>
            <div class="actions">
                <slot name="actions"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import PromptContentCardViewModel, { PromptCardViewModel } from "@components/promptcontent/PromptContentCardViewModel";
import { getMilestoneText } from "@components/insights/MilestoneTypes";
import MarkdownText from "@components/MarkdownText.vue";
import MilestoneProgress from "@components/insights/MilestoneProgress.vue";

@Component({
    components: {
        MarkdownText,
        MilestoneProgress
    }
})
export default class MilestoneCard extends Vue {
    name = "MilestoneCard";

    @Prop({ type: Number, required: true, default: 0 })
    index!: number;

    @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
    card!: PromptCardViewModel;

    get totalReflections(): number {
        return this.card.member.stats.reflections?.totalCount ?? 0
    }

    get message(): { title: string, message: string } {
        return getMilestoneText(this.totalReflections)
    }
}
</script>

<style scoped lang="scss">
@import "mixins";
@import "variables";
@import "prompts";


.milestone-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 80vh;
  padding: 0 .8rem;

  @include r(374) {
    justify-content: center;
    margin: 0 auto;
    max-width: 48rem;
    padding: 0 2.4rem;
  }
  @include r(768) {
    max-width: 64rem;
    min-height: 0;
  }
  @include r(960) {
    align-items: center;
    flex-direction: row;
    justify-content: flex-start;
    max-width: none;
    padding: 0 6.4rem;
  }
}
</style>