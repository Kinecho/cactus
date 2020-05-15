import Vue from "vue";
import Assessment from "@components/gapanalysis/Assessment.vue";
import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";
import { defaultScreens, ScreenName, Screen } from "@components/gapanalysis/GapAssessmentTypes";
import { boolean, number, select } from "@storybook/addon-knobs";
import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";

export default {
    title: "Gap Analysis/Assessment"
}

export const FullAssessment = () => Vue.extend({
    template: `
        <div :style="{margin: '4rem', border: '3px solid red'}">
            <assessment
                    :assessment="assessment"
                    :screens="screens"
                    :current-screen="screen"
                    :question-index="questionIndex"
                    :result="result"
                    :include-upsell="includeUpsell"
                    @screen="setScreen"
                    @questionChanged="setQuestion"
            />
        </div>`,
    components: {
        Assessment,
    },
    props: {
        includeUpsell: {
            default: boolean("Include Upsell", true),
        },
        questionOverride: {
            default: number("Question Index Override", 0)
        },
        screenOverride: {
            type: String as () => ScreenName,
            default: select("Screen Override", Object.values(Screen), Screen.intro)
        }
    },
    watch: {
        screenOverride(newValue) {
            this.screen = newValue;
        },
        questionOverride(newValue) {
            this.questionIndex = newValue;
        }
    },
    data(): {
        assessment: GapAnalysisAssessment,
        screen: ScreenName,
        result: GapAnalysisAssessmentResult,
        questionIndex: number,
    } {
        return {
            assessment: GapAnalysisAssessment.create(),
            result: GapAnalysisAssessmentResult.create(),
            screen: Screen.intro,
            questionIndex: 0,
        }
    },
    computed: {
        screens(): ScreenName[] {
            return defaultScreens;
        }
    },
    methods: {
        setQuestion(index: number) {
            this.questionIndex = index;
        },
        setScreen(screen: ScreenName) {
            this.screen = screen;
        }
    }
})