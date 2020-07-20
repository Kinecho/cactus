<template>
    <div class="cvQuestion">
        <div class="titleMarkdown">
            <markdown-text v-if="question.titleMarkdown" :source="question.titleMarkdown"/>
        </div>
        <div class="descriptionMarkdown">
            <markdown-text v-if="question.descriptionMarkdown" :source="question.descriptionMarkdown"/>
        </div>

        <div class="question-options">
            <template v-for="(option, index) in options">
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
    import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
    import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
    import QuestionOption from "@components/corevalues/QuestionOption.vue";
    import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
    import Logger from "@shared/Logger";
    import { QuestionType } from "@shared/models/Questions";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";

    const logger = new Logger("Question");

    @Component({
         components: {
            MarkdownText,
            QuestionOption
        }
    })
    export default class Question extends Vue {
        name = "Question";

        @Prop({ type: Object as () => CoreValuesQuestion, required: true })
        question!: CoreValuesQuestion;

        @Prop({ type: Object as () => CoreValuesQuestionResponse, required: true })
        response!: CoreValuesQuestionResponse;

        @Prop({type: Array as () => CoreValuesQuestionOption[], default: [], required: true})
        options!: CoreValuesQuestionOption[]

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
        }

        removeOption(index: number, option: CoreValuesQuestionOption) {
            this.response.removeValue(option.value);
            this.$emit("updated", this.response)
        }

        optionDisabled(option: CoreValuesQuestionOption): boolean {
            const response = this.response;
            const question = this.question;

            //Always let the user de-select an option
            if (response.contains(option.value)) {
                return false
            }

            return !response.canSelectMore(question);
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .titleMarkdown {
        font-size: 2.4rem;
        margin: 4.8rem auto;
        max-width: 60rem;
    }

    .question-options {
        padding-bottom: 6.4rem;

        @include r(768) {
            display: flex;
            flex-flow: row wrap;
            justify-content: space-between;
        }
    }

    .item {
        margin-bottom: .8rem;

        @include r(768) {
            width: 49%;
        }
    }
</style>
