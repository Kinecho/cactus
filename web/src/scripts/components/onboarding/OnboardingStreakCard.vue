<template>
    <div class="text-card">
        <markdown-text v-if="markdownText" :source="markdownText"/>
        <div class="streak">
            <span :class="{done}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span :class="{done}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span :class="{done}">
                <svg class="flag" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </span>
            <span :class="{done}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span :class="{done}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span :class="{done}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span :class="{done}">
                <svg class="flag" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </span>
        </div>
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

    @Component({
        components: {
            MarkdownText,
            SvgIcon,
            ActionButton: OnboardingActionButton,
        }
    })
    export default class OnboardingTextCard extends Vue {
        name = "OnboardingTextCard.vue";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: String, required: false, default: null })
        selectedInsightWord!: string | null;

        @Prop({type: String as CoreValue, required: false, default: null})
        selectedCoreValue!: CoreValue | null;

        @Prop({ type: Boolean, default: true })
        done!: boolean;

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

    .streak {
        display: flex;
        margin-top: 4rem;

        span {
            align-items: center;
            background-color: $white;
            border-radius: 50%;
            display: flex;
            height: 4rem;
            justify-content: center;
            margin-right: .4rem;
            width: 4rem;

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

    .text-card {
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
            width: 100%;

            @include r(768) {
                min-width: 24rem;
                width: auto;
            }
        }
    }
</style>
