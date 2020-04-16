<template>
    <div class="question-option">
        <div class="main">
            <span class="select" @click="clicked">{{selected ? 'Selected' : 'Not selected'}}</span>
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

    const logger = new Logger("QuestionOption");
    export default Vue.extend({
        name: "QuestionOption",
        components: {
            MarkdownText,
        },
        props: {
            option: { type: Object as () => CoreValuesQuestionOption, required: true },
            selected: { type: Boolean, default: false }
        },
        data(): {
            expanded: boolean
        } {
            return {
                expanded: false,
            }
        },
        methods: {
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