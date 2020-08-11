import Vue from "vue";
import MilestoneProgress from "@components/insights/MilestoneProgress.vue"
import { number } from "@storybook/addon-knobs";

export default {
    title: "Insights/Milestone Progress"
}

export const OneDay = () => Vue.extend({
    template: `<MilestoneProgress :total-reflections="totalReflections"/>`,
    components: {
        MilestoneProgress,
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 1)
        }
    }
})

export const ThreeDays = () => Vue.extend({
    template: `<MilestoneProgress :total-reflections="totalReflections"/>`,
    components: {
        MilestoneProgress,
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 3)
        }
    }
})

export const SevenDays = () => Vue.extend({
    template: `<MilestoneProgress :total-reflections="totalReflections"/>`,
    components: {
        MilestoneProgress,
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 7)
        }
    }
})

