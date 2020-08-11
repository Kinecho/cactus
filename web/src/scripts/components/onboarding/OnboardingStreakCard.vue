<template>
    <div class="text-card">
        <markdown-text v-if="markdownText" :source="markdownText"/>
        <milestone-progress :total-reflections="totalReflections"/>
        <div class="actions" v-if="card.buttons && card.buttons.length > 0">
            <ActionButton v-for="(button, index) in card.buttons"
                    :key="index"
                    :button="button"
                    @complete="closeOnboarding"
            />
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";
    import OnboardingActionButton from "@components/OnboardingActionButton.vue";
    import CactusMember from "@shared/models/CactusMember";
    import { CoreValue } from "@shared/models/CoreValueTypes";
    import SvgIcon from "@components/SvgIcon.vue";
    import MilestoneProgress from "@components/insights/MilestoneProgress.vue";

    @Component({
        components: {
            MilestoneProgress,
            MarkdownText,
            SvgIcon,
            ActionButton: OnboardingActionButton,
        }
    })
    export default class OnboardingStreakCard extends Vue {
        name = "OnboardingStreakCard.vue";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: String, required: false, default: null })
        selectedInsightWord!: string | null;

        @Prop({type: String as () => CoreValue, required: false, default: null})
        selectedCoreValue!: CoreValue | null;

        @Prop({ type: Boolean, default: true })
        done!: boolean;

        get totalReflections(): number {
            return 1
        }

        get markdownText() {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsightWord, selectedCoreValue: this.selectedCoreValue })
        }

        closeOnboarding() {
            this.$emit('close', true)
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .text-card {
        display: flex;
        flex-direction: column;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            justify-content: center;
            margin: 0 auto;
            max-width: 48rem;
        }
        @include r(768) {
            max-width: none;
            padding: 0 6.4rem;
        }
    }

    .actions {
        bottom: 2.4rem;
        left: 2.4rem;
        position: fixed;
        right: 2.4rem;

        @include r(768) {
            margin-top: 3.2rem;
            position: static;
        }

        button {
            margin-left: 50%;
            max-width: 48rem;
            transform: translateX(-50%);
            width: 100%;

            @include r(768) {
                margin: 0;
                min-width: 24rem;
                transform: none;
                width: auto;
            }
        }
    }
</style>
