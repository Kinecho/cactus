import Vue from "vue";
import ReflectionStatsWidget from "@components/insights/ReflectionStatsWidget.vue";
import { ReflectionStats } from "@shared/models/CactusMember";
import { boolean, number } from "@storybook/addon-knobs";

export default {
    title: "Insights/Widgets/Stats"
}

export const MemberReflection = () => Vue.extend({
    template: `
        <div>
            <reflection-stats-widget :reflection-stats="stats"/>
        </div>`,
    props: {
        hasStats: {
            default: boolean("Has Stats", true),
        },
        totalDurationSeconds: {
            default: number("Total Duration (seconds)", 34)
        },
        streakMonths: {
            default: number("Streak (Months)", 3),
        },
        streakWeeks: {
            default: number("Streak (Weeks)", 4),
        },
        streakDays: {
            default: number("Streak (Days)", 32),
        },
        totalReflections: {
            default: number("Total Reflections", 53),
        }
    },
    computed: {
        stats(): ReflectionStats | null {
            if (!this.hasStats) {
                return null;
            }

            return {
                totalDurationMs: this.totalDurationSeconds * 1000,
                currentStreakMonths: this.streakMonths,
                currentStreakWeeks: this.streakWeeks,
                currentStreakDays: this.streakDays,
                elementAccumulation: {
                    emotions: 0,
                    energy: 0,
                    experience: 0,
                    meaning: 0,
                    relationships: 0
                },
                totalCount: this.totalReflections,
            }
        }
    },
    components: {
        ReflectionStatsWidget
    }
})