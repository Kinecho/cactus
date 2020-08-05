<template>
    <div class="onboardingCard">
        <component
                :is="cardInfo.type"
                :member="member"
                v-bind="cardInfo.props"
                @selectedWord="setSelectedWord"
                @coreValuesResponse="setCoreValueResponse"
                @next="$emit('next')"
                @previous="$emit('previous')"
                @checkout="$emit('checkout')"
                @close="handleClose"
                @enableKeyboardNavigation="handleKeyboardNavigation"
        />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import { Prop } from "vue-property-decorator";
import OnboardingCardViewModel, { CardType } from "@components/onboarding/OnboardingCardViewModel";
import PhotoCard from "@components/onboarding/OnboardingPhotoCard.vue";
import TextCard from "@components/onboarding/OnboardingTextCard.vue";
import StreakCard from "@components/onboarding/OnboardingStreakCard.vue";
import ReflectCard from "@components/onboarding/OnboardingReflectCard.vue";
import ElementsCard from "@components/onboarding/OnboardingElementsCard.vue";
import WordCloudCard from "@components/onboarding/OnboardingWordCloudCard.vue";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import UpsellCard from "@components/onboarding/OnboardingUpsellCard.vue";
import CelebrateCard from "@components/onboarding/OnboardingCelebrateCard.vue";
import InsightsCard from "@components/onboarding/OnboardingInsightsCard.vue";
import { CheckoutInfo } from "@components/onboarding/OnboardingTypes";
import CactusMember from "@shared/models/CactusMember";
import { InsightWord } from "@shared/api/InsightLanguageTypes";
import MiniCoreValuesCard from "@components/onboarding/MiniCoreValuesCard.vue";
import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";

interface CardProps {
    type: string,
    props: { card: OnboardingCardViewModel, [key: string]: any },
}

@Component({
    components: {
        TextCard,
        StreakCard,
        PhotoCard,
        ReflectCard,
        ElementsCard,
        WordCloudCard,
        UpsellCard,
        CelebrateCard,
        InsightsCard,
        MiniCoreValuesCard
    }
})
export default class OnboardingCardWrapper extends Vue {
    name = "OnboardingCardWrapper";

    @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
    card!: OnboardingCardViewModel;

    @Prop({ type: Object as () => SubscriptionProduct, required: false, default: null })
    product?: SubscriptionProduct | null;

    @Prop(({ type: Object as () => CheckoutInfo, required: false, default: null }))
    checkoutInfo!: CheckoutInfo | null;

    @Prop({ type: Object as () => CactusMember, required: true })
    member!: CactusMember;

    @Prop({ type: Object as () => InsightWord, required: false, default: null })
    selectedWord!: InsightWord | null;

    @Prop({ type: Object as () => CoreValuesAssessmentResponse, required: false, default: null })
    coreValuesResponse!: CoreValuesAssessmentResponse | null;

    setSelectedWord(word: InsightWord | null) {
        this.$emit('selectedWord', word);
    }

    setCoreValueResponse(results: CoreValuesAssessmentResponse | null) {
        this.$emit("coreValuesResponse", results);
    }

    handleClose(force: boolean = false) {
        this.$emit('close', force)
    }

    handleKeyboardNavigation(enabled: boolean) {
        this.$emit('enableKeyboardNavigation', enabled)
    }

    get cardInfo(): CardProps {
        let info: CardProps = { type: "text-card", props: { card: this.card } }
        const coreValue = this.coreValuesResponse?.results?.values[0] ?? null;
        switch (this.card.type) {
            case CardType.text:
                info.type = "text-card";
                info.props.selectedInsightWord = this.selectedWord?.word;
                info.props.selectedCoreValue = coreValue;
                break;
            case CardType.streak:
                info.type = "streak-card";
                info.props.selectedInsightWord = this.selectedWord?.word;
                info.props.selectedCoreValue = coreValue;
                break;
            case CardType.reflect:
                info.type = "reflect-card";
                info.props.selectedInsightWord = this.selectedWord?.word;
                info.props.selectedCoreValue = coreValue;
                break;
            case CardType.elements:
                info.type = "elements-card";
                break;
            case CardType.word_cloud:
                info.type = "word-cloud-card";
                info.props.words = this.member?.wordCloud ?? [];
                break;
            case CardType.insights:
                info.type = "insights-card";
                // info.props.promptContentEntryId = this.prompC
                break;
            case CardType.upsell:
                info.type = "upsell-card";
                info.props.product = this.product ?? null;
                info.props.checkoutInfo = this.checkoutInfo;
                info.props.member = this.member;
                break;
            case CardType.celebrate:
                info.type = "celebrate-card"
                break;
            case CardType.mini_core_values:
                info.type = "mini-core-values-card";
                info.props.coreValuesResponse = this.coreValuesResponse;
                break;
            default:
                break;
        }
        return info;
    }
}
</script>

<style scoped lang="scss">
@import "mixins";

.onboardingCard {
  padding: 4rem 2.4rem;

  @include r(374) {
    //do not add margin: auto here as it makes the cards jumpy
    padding: 5.6rem 3.2rem;
    width: 100%;
  }
}
</style>
