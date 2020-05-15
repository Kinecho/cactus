import Vue from "vue";
import '@styles/common.scss';
import GapAnalysisWidget from "@components/insights/GapAnalysisWidget.vue";
import { boolean } from "@storybook/addon-knobs";
import { cactusElementSelect } from "@web/StorybookHelpers";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";


export default {
    title: "Insights/Widgets"
}

export const MultipleSubscriptionTiers = () => Vue.extend({
    template: `
        <div>
            <section :style="sectionStyle">
                <h2>BASIC USER</h2>
                <GapAnalysisWidget
                        :member-focus-element="focusElement"
                        :is-plus-member="false"
                        :loading="loading"
                        :gap-assessment-results="results"
                />
            </section>
            <section :style="sectionStyle">
                <h2>PLUS USER</h2>
                <GapAnalysisWidget
                        :member-focus-element="focusElement"
                        :is-plus-member="true"
                        :loading="loading"
                        :gap-assessment-results="results"
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
            default: boolean("Has Results", false)
        }
    },
    computed: {
        results(): GapAnalysisAssessmentResult | null {
            return this.withResults ? GapAnalysisAssessmentResult.mock() : null;
        },
        sectionStyle(): any {
            return {
                padding: '1rem',

            }
        }
    }
})