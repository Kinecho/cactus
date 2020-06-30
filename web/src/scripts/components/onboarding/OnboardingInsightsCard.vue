<template>
    <div class="insights-card">
        <spinner v-if="loading"/>
        <div class="textBox">
            <!-- <p v-if="reflectionResponse.toneAnalysis">
                This is the positivity rating of your note. Write more to reveal different emotions.
            </p> -->
            <p>This is what your note reveals about your emotions.</p>
        </div>
        <div class="insightsContainer">
            <positivity-rating :sentiment-score="reflectionResponse.sentiment.documentSentiment"/>
            <tone-analysis :tone-result="reflectionResponse.toneAnalysis"
                    :original-text="reflectionResponse.content.text"
                    :sentences-on-new-line="false"
                    @previous="previous"
            />
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


        previous() {
            this.$emit("previous");
        }

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
        padding: 2.4rem 1.6rem;

        @include r(374) {
            padding: 2.4rem;
        }

        @include r(960) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
        }
    }

    .textBox {
        margin-bottom: 3.2rem;

        @include r(600) {
            margin: 0 auto 3.2rem;
            max-width: 60rem;
            width: 100%;
        }
        @include r(960) {
            margin-bottom: 0;
            padding-right: 6.4rem;
            width: 50%;
        }
    }

    .insightsContainer {
        font-size: 1.8rem;
        width: 100%;

        @include r(600) {
            margin: 0 auto;
            max-width: 60rem;
        }
        @include r(960) {
            align-self: center;
            font-size: 2rem;
            max-width: 50%;
        }
    }

</style>
