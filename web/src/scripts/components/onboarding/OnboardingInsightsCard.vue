<template>
    <div class="insights-card">
        <spinner v-if="loading"/>
        <div class="textBox">
            <p v-if="!reflectionResponse">
                No Response Found
            </p>
            <p v-else>This is what your note reveals about your emotions.</p>
        </div>
        <div class="insightsContainer">
            <positivity-rating :sentiment-score="reflectionResponse.sentiment.documentSentiment"/>
            <tone-analysis :tone-result="reflectionResponse.toneAnalysis"
                    :original-text="reflectionResponse.content.text"
                    :sentences-on-new-line="false"/>
        </div>
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
    @import "variables";
    @import "mixins";

    .insights-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 80vh;
        padding: 0 .8rem;

        @include r(374) {
            padding: 0 2.4rem;
        }

        @include r(600) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            padding: 0 6.4rem;
        }
    }

    .textBox {
        @include r(600) {
            padding-right: 6.4rem;
            width: 50%;
        }
    }

    .insightsContainer {
        font-size: 1.8rem;
        margin: 0 -2.4rem;
        width: calc(100% + 4.8rem);

        @include r(600) {
            align-self: center;
            font-size: 2rem;
            margin: 0 auto;
            max-width: 50%;
            width: 100%;
        }
    }

</style>
