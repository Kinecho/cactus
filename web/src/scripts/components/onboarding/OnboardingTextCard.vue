<template>
    <div class="text-card">
        <div class="textBox">
            <markdown-text v-if="markdownText" :source="markdownText"/>
            <div class="actions" v-if="card.buttons && card.buttons.length > 0">
                <ActionButton v-for="(button, index) in card.buttons"
                        :key="index"
                        :button="button"
                        @complete="closeOnboarding"
                />
            </div>
        </div>
        <img height="300" width="300" class="image" v-if="card.imageUrl" :src="card.imageUrl" alt="Image"/>
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

    @Component({
        components: {
            MarkdownText,
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

        get markdownText() {
            return this.card.getMarkdownText({ selectedInsight: this.selectedInsightWord })
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
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            max-width: none;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        margin-bottom: 5.6rem;

        @include r(768) {
            margin-bottom: 0;
            padding-right: 6.4rem;
            width: 66%;
        }
    }

    .image {
        height: auto;
        width: 100%;

        @include r(768) {
            align-self: center;
            max-width: 33%;
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
