<template>
    <div>
        <markdown-text :source="question.title"/>
        <div class="options">
            <template v-for="(option, index) in question.options">
                <gap-option :option="option" :key="`option_${index}`" :selected="currentValue === option.value" @change="setValue"/>
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

</style>