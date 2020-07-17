<template>
    <div class="cvQuestion">
        <div class="titleMarkdown">
            <markdown-text :source="question.title"/>
        </div>
        <div class="question-options">
            <template v-for="(option, index) in question.options">
                <gap-option :key="`option_${index}`"
                        :option="option"
                        :selected="currentValue === option.value"
                        @change="setValue"
                        :focused="focusedIndex === index"
                        @focus="focusedIndex = index"
                />
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import GapOption from "@components/gapanalysis/Option.vue";
    import { Prop } from "vue-property-decorator";
    import GapAnalysisQuestion from "@shared/models/GapAnalysisQuestion";
    import MarkdownText from "@components/MarkdownText.vue";
    import Logger from "@shared/Logger"

    const logger = new Logger("Question");

    @Component({
        components: {
            GapOption,
            MarkdownText,
        }
    })
    export default class Question extends Vue {
        @Prop({ type: Object as () => GapAnalysisQuestion, required: true })
        question!: GapAnalysisQuestion;

        @Prop({ type: Number, required: false })
        currentValue?: number;

        focusedIndex: number | null = null;

        setValue(selected: boolean, value: number | undefined) {
            this.focusedIndex = null;
            this.$emit("change", selected ? value : undefined);
        }

        beforeMount() {
            window.addEventListener("keyup", this.onKeyUp);
        }

        destroyed() {
            logger.info("removing key listener");
            window.removeEventListener("keyup", this.onKeyUp);
        }

        get currentIndex(): number | null {
            if (this.currentValue) {
                return this.question.options.findIndex(o => o.value === this.currentValue);
            }
            return null;
        }

        onKeyUp(event: KeyboardEvent) {
            if (event.key === "Escape" || event.keyCode === 27) {
                this.focusedIndex = null;
            } else if (event.key === "Enter" || event.keyCode === 13) {
                //handle enter
                if (this.focusedIndex !== null) {
                    const questionValue = this.question.options[this.focusedIndex].value;
                    this.setValue(this.currentValue !== questionValue, questionValue);
                } else if (this.currentValue !== undefined && this.currentValue !== null) {
                    this.$emit('submit');
                }
            } else if (event.key === "ArrowDown" || event.keyCode === 40) {
                //handle arrow down
                this.focusedIndex = Math.min(this.question.options.length - 1, (this.focusedIndex ?? this.currentIndex ?? -1) + 1);
            } else if (event.key === "ArrowUp" || event.keyCode === 38) {
                //handle arrow down
                this.focusedIndex = Math.max(0, (this.focusedIndex ?? this.currentIndex ?? 1) - 1);
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .cvQuestion {
        margin: 0 auto;
        max-width: 60rem;
    }

    .titleMarkdown {
        font-size: 2.4rem;
        margin: 4.8rem auto;
    }

    .question-options {
        padding-bottom: 6.4rem;
    }

</style>
