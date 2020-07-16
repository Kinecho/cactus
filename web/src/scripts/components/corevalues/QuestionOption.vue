<template>
    <div class="question-option" :class="{expanded: expanded}">
        <div class="main">
            <!--            <span class="select" @click="clicked">{{selected ? 'Selected' : 'Not selected'}}</span>-->

            <div class="grow"><check-box
                    :model-value="selected"
                    :label="option.title"
                    @change="selectionChanged"
                    :type="this.type"
                    :disabled="disabled"
                    :extraPadding="true"/>
            </div>

            <button class="expand-toggle tertiary icon" @click="expanded = !expanded">
                <svg class="arrowIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 8"><path d="M1.707.293A1 1 0 10.293 1.707l6 6a1 1 0 001.414 0l6-6A1 1 0 1012.293.293L7 5.586 1.707.293z"/></svg>
            </button>
        </div>

        <div class="expandable" :class="{closed: !expanded}" v-show="expanded">
            <markdown-text :source="option.description"/>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CoreValuesQuestionOption from "@shared/models/CoreValuesQuestionOption";
    import MarkdownText from "@components/MarkdownText.vue";
    import Logger from "@shared/Logger";
    import CheckBox from "@components/CheckBox.vue";
    import { QuestionType } from "@shared/models/Questions";

    const logger = new Logger("QuestionOption");
    export default Vue.extend({
        name: "QuestionOption",
        components: {
            MarkdownText,
            CheckBox,
        },
        props: {
            option: { type: Object as () => CoreValuesQuestionOption, required: true },
            type: { type: String as () => QuestionType, required: true, default: QuestionType.MULTI_SELECT },
            selected: { type: Boolean, default: false },
            disabled: {type: Boolean, default: false},
        },
        data(): {
            expanded: boolean
        } {
            return {
                expanded: false,
            }
        },
        methods: {
            selectionChanged(selected: boolean) {
                if (!selected) {
                    this.$emit("removed")
                } else {
                    this.$emit("selected")
                }
            },
            clicked() {
                logger.info("toggling item. settting to", !this.selected);
                if (this.selected) {
                    this.$emit("removed")
                } else {
                    this.$emit("selected")
                }
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .question-option {
        background-color: $white;
        border: 1px solid $lightestGreen;
        border-radius: .4rem;
        padding-right: .8rem;
    }

    .main {
        align-items: center;
        display: flex;
        justify-content: space-between;
    }

    .grow {
        flex-grow: 1;
    }

    .arrowIcon {
        fill: $green;
        height: 1rem;
        transform: none;
        transition: .2s transform linear;
        width: 1.2rem;

        .expanded & {
            transform: rotate(180deg);
        }

        .disabled > & {
            fill: #ccc;
        }
    }

    .expandable {
        font-size: 1.6rem;
        opacity: .8;
        padding: 0 1.6rem 2rem 1.8rem;
        text-align: left;
    }

</style>
