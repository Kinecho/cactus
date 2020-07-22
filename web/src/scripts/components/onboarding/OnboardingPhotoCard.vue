<template>
    <div class="photo-card">
        <h1>IMAGE Card {{card.id}}</h1>
        <markdown-text v-if="card.text" :source="card.text"/>
        <img src="/assets/images/teacher.svg"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import OnboardingCardViewModel from "@components/onboarding/OnboardingCardViewModel";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";

    @Component({
        components: {
            MarkdownText,
        }
    })
    export default class OnboardingPhotoCard extends Vue {
        name = "OnboardingTextCard.vue";

        @Prop({ type: Object as () => OnboardingCardViewModel, required: true })
        card!: OnboardingCardViewModel;


    }
</script>

<style scoped lang="scss">
        .photo-card {
            text-align: center;
            color: red;
            img {
                max-width: 20rem;
            }
        }
</style>