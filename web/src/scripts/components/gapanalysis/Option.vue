<template>
    <div class="question-option">
        <div class="main">
            <check-box :model-value="selected" :label="label" @change="selectionChanged" :type="this.type" :disabled="disabled" :extraPadding="true"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import GapAnalysisQuestionOption from "@shared/models/GapAnalysisQuestionOption";
    import { Prop } from "vue-property-decorator";
    import CheckBox from "@components/CheckBox.vue";
    import { QuestionType } from "@shared/models/Questions";

    @Component({
        components: {
            CheckBox,
        }
    })
    export default class Option extends Vue {
        @Prop({ type: Object as () => GapAnalysisQuestionOption, required: true })
        option!: GapAnalysisQuestionOption;

        @Prop({ type: Boolean, default: false, required: true })
        selected!: boolean

        @Prop({ type: Boolean, default: false, required: false })
        disabled: boolean = false

        type = QuestionType.RADIO;

        selectionChanged(selected: boolean) {
            this.$emit('change', selected ? this.option.value : undefined);
        }

        get label(): string {
            return this.option.label ?? "";
        }
    }
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

</style>