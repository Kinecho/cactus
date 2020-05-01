import Vue from "vue";
import GapOption from "@components/gapanalysis/Option.vue";
import GapAnalysisQuestionOption from "@shared/models/GapAnalysisQuestionOption";
import { boolean } from "@storybook/addon-knobs";

export default {
    title: "Gap Analysis/Option"
}

export const SingleWithLabel = () => Vue.extend({
    template: `
        <gap-option :option="option" :selected="selected" @change="handleChange" :disabled="disabled"/>`,
    components: {
        GapOption
    },
    props: {
        disabled: { default: boolean("Disabled", false) }
    },
    data(): {
        option: GapAnalysisQuestionOption,
        selected: boolean,
    } {
        return {
            option: GapAnalysisQuestionOption.create(0, "Not at all important"),
            selected: false,
        }
    },
    methods: {
        handleChange(selected: boolean, value: number) {
            this.selected = selected;
        },
    }
})

export const Multiple = () => Vue.extend({
    template: `
        <div>
            <div :style="{color: 'red'}">
                Current Value: {{current}}
            </div>
            <gap-option :option="option0" :selected="selectedValue === 0" @change="handleChange" :disabled="disabled"/>
            <gap-option :option="option1" :selected="selectedValue === 1" @change="handleChange" :disabled="disabled"/>
            <gap-option :option="option2" :selected="selectedValue === 2" @change="handleChange" :disabled="disabled"/>
        </div>
    `,
    components: {
        GapOption
    },
    props: {
        disabled: { default: boolean("Disabled", false) }
    },
    data(): {
        option0: GapAnalysisQuestionOption,
        option1: GapAnalysisQuestionOption,
        option2: GapAnalysisQuestionOption,
        selectedValue: number | null,

    } {
        return {
            option0: GapAnalysisQuestionOption.create(0, "Not at all important"),
            option1: GapAnalysisQuestionOption.create(1),
            option2: GapAnalysisQuestionOption.create(2, "Somewhat important"),
            selectedValue: null,
        }
    },
    computed: {
        current(): string {
            return `${ this.selectedValue ?? '--' }`
        }
    },
    methods: {
        handleChange(selected: boolean, value: number) {
            if (selected) {
                this.selectedValue = value;
            } else {
                this.selectedValue = null;
            }
        },
    }
})