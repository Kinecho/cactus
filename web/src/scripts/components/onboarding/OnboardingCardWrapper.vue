<template>
    <component :is="cardInfo.type" v-bind="cardInfo.props"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { CardType, OnboardingCardViewModel } from "@components/onboarding/OnboardingCardViewModel";
    import PhotoCard from "@components/onboarding/OnboardingPhotoCard.vue";
    import TextCard from "@components/onboarding/OnboardingTextCard.vue";
    import ReflectCard from "@components/onboarding/OnboardingReflectCard.vue";
    import ElementsCard from "@components/onboarding/OnboardingElementsCard.vue";
    import WordCloudCard from "@components/onboarding/OnboardingWordCloudCard.vue";
    import { InsightWord } from "@shared/models/ReflectionResponse";

    interface CardProps {
        type: string,
        props: { card: OnboardingCardViewModel, [key: string]: any },
    }

    @Component({
        components: {
            TextCard,
            PhotoCard,
            ReflectCard,
            ElementsCard,
            WordCloudCard,
        }
    })
    export default class OnboardingCardWrapper extends Vue {
        name = "OnboardingCardWrapper";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        get cardInfo(): CardProps {
            let info: CardProps = { type: "text-card", props: { card: this.card } }
            switch (this.card.type) {
                case CardType.text:
                    info.type = "text-card";
                    break;
                case CardType.photo:
                    info.type = "photo-card";
                    break;
                case CardType.reflect:
                    info.type = "reflect-card";
                    break;
                case CardType.elements:
                    info.type = "elements-card";
                    break;
                case CardType.word_cloud:
                    let words: InsightWord[] = [{ word: "Shadow", frequency: 0.8 }, {
                        word: "Dogs",
                        frequency: 0.7
                    }, { word: "Cats", frequency: 1 }]
                    info.type = "word-cloud-card";
                    info.props.words = words;
                    break;
                default:
                    break;
            }
            return info;
        }
    }
</script>

<style scoped lang="scss">
</style>
