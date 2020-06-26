<template>
    <div>
        <spinner v-if="loading"/>
        <h1>This is onboarding insights</h1>
        <h2 v-if="!reflectionResponse">
            No Response Found
        </h2>
        <h2 v-else>
            <positivity-rating :sentiment-score="reflectionResponse.sentiment.documentSentiment"/>
            <tone-analysis :tone-result="reflectionResponse.toneAnalysis"
                    :original-text="reflectionResponse.content.text"
                    :sentences-on-new-line="false"/>
        </h2>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import { Prop } from "vue-property-decorator";
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import ReflectionResponseService from "@web/services/ReflectionResponseService";
    import Spinner from "@components/Spinner.vue";
    import InsightsCard from "@components/InsightsCard.vue";
    import PositivityRating from "@components/PositivityRating.vue";
    import ToneAnalysis from "@components/ToneAnalysis.vue";

    @Component({
        components: {
            InsightsCard,
            Spinner,
            PositivityRating,
            ToneAnalysis,
        }
    })
    export default class OnboardingInsightsCard extends Vue {
        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;

        name = "OnboardingInsightsCard";
        loading = true;
        reflectionResponse: ReflectionResponse | null = null;
        responseObserver: ListenerUnsubscriber | null | undefined = null;


        beforeMount() {
            const promptEntryId = this.card.promptContentEntryId;
            if (!promptEntryId) {
                //TODO: handle error state
                return;
            }
            this.responseObserver = ReflectionResponseService.sharedInstance.observeForPromptId(promptEntryId, {
                onData: async responses => {
                    const [response] = responses;
                    if (response) {
                        this.reflectionResponse = response
                    } else {
                        this.reflectionResponse = null;
                    }
                    this.loading = false;
                },
            });
        }

        beforeDestroy() {
            this.responseObserver?.();
        }


    }
</script>

<style scoped lang="scss">

</style>