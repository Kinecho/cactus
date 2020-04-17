<template>
    <div class="question-option">
        <div class="main">
            <!--            <span class="select" @click="clicked">{{selected ? 'Selected' : 'Not selected'}}</span>-->

            <check-box :model-value="selected" label="" @change="selectionChanged" :type="this.type" :disabled="disabled"/>

            <markdown-text :source="option.title"/>
            <button class="expand-toggle icon" @click="expanded = !expanded">{{expanded ? 'Close' : 'Open'}}</button>
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
    import { QuestionType } from "@shared/models/CoreValuesQuestion";

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
        padding: 1rem;
        border: 1px solid black;

        .main {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
    }

    .expandable {
        .closed {
            height: 0;
        }
    }
</style>