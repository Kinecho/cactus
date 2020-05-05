<template>
    <div class="cvQuestion">
        <div class="titleMarkdown"><markdown-text :source="question.title"/></div>
        <div class="question-options">
            <template v-for="(option, index) in question.options">
                <div class="item" :key="`option_${index}`">
                    <gap-option :option="option" :selected="currentValue === option.value" @change="setValue"/>
                </div>
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

        setValue(selected: boolean, value: number | undefined) {
            this.$emit("change", selected ? value : undefined);
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .cvQuestion {
        padding-top: 3.2rem;
    }

    .titleMarkdown {
        margin: 0 auto 4rem;
        max-width: 60rem;
    }

    .question-options {
        padding-bottom: 6.4rem;
    }

    .item {
        margin-bottom: .8rem;
    }

</style>
