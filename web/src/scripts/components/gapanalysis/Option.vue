<template>
    <div class="question-option" :class="[{'selected':selected}]">
        <div class="main">
            <div class="grow">
                <check-box :model-value="selected"
                        :label="label"
                        :icon="icon"
                        @change="selectionChanged"
                        :type="this.type"
                        :disabled="disabled"
                        :extraPadding="true"/>
            </div>
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

        @Prop({ type: Boolean, default: false, required: false })
        selected: boolean = false

        @Prop({ type: Boolean, default: false, required: false })
        disabled: boolean = false

        type = QuestionType.RADIO;

        selectionChanged(selected: boolean) {
            this.$emit('change', selected, this.option.value);
        }

        get icon(): string {
            return this.option.icon ?? "";
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
        font-weight: normal;
        padding-right: .8rem;
        transition: all .2s cubic-bezier(.42, .97, .52, 1.49);

        &.selected {
            background-color: lighten($green, 40%);
            font-weight: bold;
        }
    }

    .main {
        align-items: center;
        display: flex;
        justify-content: space-between;
    }

    .grow {
        flex-grow: 1;
    }

</style>
