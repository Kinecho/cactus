import Vue from "vue";
import '@styles/common.scss';
import GapAnalysisWidget from "@components/insights/GapAnalysisWidget.vue";
import { boolean } from "@storybook/addon-knobs";
import { cactusElementSelect } from "@web/StorybookHelpers";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
import { CactusElement } from "@shared/models/CactusElement";
import { action } from "@storybook/addon-actions";
import { isBlank } from "@shared/util/StringUtil";


export default {
    title: "Insights/Widgets/Gap Analysis"
}

export const MultipleSubscriptionTiers = () => Vue.extend({
    template: `
        <div>
            <section :style="sectionStyle">
                <h2>BASIC USER</h2>
                <GapAnalysisWidget
                        :member-focus-element="element"
                        :is-plus-member="false"
                        :loading="loading"
                        :gap-assessment-results="results"
                />
            </section>
            <section :style="sectionStyle">
                <h2>PLUS USER</h2>
                <GapAnalysisWidget
                        :member-focus-element="element"
                        :is-plus-member="true"
                        :loading="loading"
                        :gap-assessment-results="results"
                        :show-gap-analysis-labels="showLabels"
                        :show-legend="showLegend"
                        @focusElement="saveFocus"
                />
            </section>
        </div>`,
    components: {
        GapAnalysisWidget,
    },
    props: {
        focusElement: {
            default: cactusElementSelect(),
        },
        loading: {
            default: boolean("Loading Results", false)
        },
        withResults: {
            default: boolean("Has Results", true)
        },
        showLabels: {
            default: boolean("Show Element Labels", true)
        },
        showLegend: {
            default: boolean("Show Legend", true),
        }
    },
    computed: {
        element(): CactusElement | null {
            if (isBlank(this.focusElement) || this.focusElement === "null") {
                return null;
            }
            return this.focusElement as CactusElement;
        },
        results(): GapAnalysisAssessmentResult | null {
            return this.withResults ? GapAnalysisAssessmentResult.mock() : null;
        },
        sectionStyle(): any {
            return {
                padding: '1rem',

            }
        }
    }, methods: {
        saveFocus(element: CactusElement | null) {
            action('saved element: ')(element);
        }
    }
})