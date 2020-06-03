import Vue from "vue";
import StatWidget from "@components/insights/StatWidget.vue";
import { svgIconSelect } from "@web/StorybookHelpers";
import { StatWidgetData } from "@components/insights/MemberStatsTypes";
import { text } from "@storybook/addon-knobs";
import { SvgIconName } from "@shared/types/IconTypes";

export default {
    title: "Insights/Widgets/Stats"
}

export const SingleStat = () => Vue.extend({
    template: `
        <div :style="{padding: '4rem'}">
            <StatWidget :stat="stat"/>
        </div>`,
    components: {
        StatWidget,
    },
    props: {
        icon: {
            type: String as () => SvgIconName,
            default: svgIconSelect("flame")
        },
        label: {
            type: String,
            default: text("Label", "Random")
        },
        unit: {
            default: text("Unit", "Units")
        },
        value: {
            default: text("Value", "2,121")
        }
    },
    computed: {
        stat(): StatWidgetData {
            return {
                icon: this.icon,
                label: this.label,
                unit: this.unit,
                value: this.value,
            }
        }
    }
})