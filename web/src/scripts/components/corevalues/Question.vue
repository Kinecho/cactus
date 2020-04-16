<template>
    <div class="question">
        <markdown-text v-if="question.titleMarkdown" :source="question.titleMarkdown"/>
        <markdown-text v-if="question.descriptionMarkdown" :source="question.descriptionMarkdown"/>

        <div class="question-options">
            <template v-for="(option, index) in question.options">
                <div class="item" :key="`question_${question.id}_option_${index}`">
                    <question-option :option="option"/>
                </div>
            </template>

        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MarkdownText from "@components/MarkdownText.vue";
    import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
    import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
    import QuestionOption from "@components/corevalues/QuestionOption.vue";


    export default Vue.extend({
        name: "Question",
        components: {
            MarkdownText,
            QuestionOption
        },
        props: {
            question: { type: Object as () => CoreValuesQuestion, required: true },
            response: { type: Object as () => CoreValuesQuestionResponse, required: true },
        },
    })
</script>

<style scoped lang="scss">
    @import "variables";
    @import "variables";

    .question-options {
        display: flex;
        flex-direction: column;

        .item {
            margin-bottom: 2rem;
        }
    }
</style>