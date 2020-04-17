<template>
    <div class="question">
        <markdown-text v-if="question.titleMarkdown" :source="question.titleMarkdown"/>
        <markdown-text v-if="question.descriptionMarkdown" :source="question.descriptionMarkdown"/>

        <div class="question-options">
            <template v-for="(option, index) in question.options">
                <div class="item" :key="`question_${question.id}_option_${index}`">
                    <question-option :option="option"
                            :selected="response.contains(option.value)"
                            :type="question.type"
                            :disabled="optionDisabled(option)"
                            @selected="selectOption(index, option)"
                            @removed="removeOption(index, option)"/>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MarkdownText from "@components/MarkdownText.vue";
    import CoreValuesQuestion, { QuestionType } from "@shared/models/CoreValuesQuestion";
    import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
    import QuestionOption from "@components/corevalues/QuestionOption.vue";
    import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
    import Logger from "@shared/Logger";

    const logger = new Logger("Question");

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
        methods: {
            selectOption(index: number, option: CoreValuesQuestionOption) {
                if (this.question.type === QuestionType.RADIO) {
                    logger.info("Radio - setting single value", option.value);
                    this.response.setSingeValue(option.value);
                } else {
                    logger.info("Multi select - adding value", option.value);
                    this.response.addValue(option.value)
                }
                this.$emit("updated", this.response);
                logger.info(`response contains(${ option.value }) = ${ this.response.contains(option.value) }`);
            },
            removeOption(index: number, option: CoreValuesQuestionOption) {
                this.response.removeValue(option.value);
                this.$emit("updated", this.response)
            },
            optionDisabled(option: CoreValuesQuestionOption): boolean {
                const response = this.response;
                const question = this.question;

                //Always let the user de-select an option
                if (response.contains(option.value)) {
                    return false
                }

                if (question.type === QuestionType.MULTI_SELECT) {
                    if (question.multiSelectLimit && question.multiSelectLimit <= response.values.length) {
                        return true;
                    }
                }

                return false;
            }
        }
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