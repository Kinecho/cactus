<template>
    <div class="statsContainer">
        <stat-widget class="stat" v-for="(stat, index) in stats"
                :stat="stat"
                :key="`stat_${index}`">
        </stat-widget>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { ReflectionStats } from "@shared/models/CactusMember";
    import { StatWidgetData } from "@components/insights/MemberStatsTypes";
    import { millisecondsToMinutes } from "@shared/util/DateUtil";
    import CopyService from "@shared/copy/CopyService";
    import SvgIcon from "@components/SvgIcon.vue";
    import StatWidget from "@components/insights/StatWidget.vue";
    import { Prop } from "vue-property-decorator";

    @Component({
        components: { StatWidget, SvgIcon }
    })
    export default class StreakWidget extends Vue {
        name = "MemberStatsWidget.vue";
        copy = CopyService.getSharedInstance().copy;

        @Prop({ type: Object as () => ReflectionStats, default: null, required: true })
        reflectionStats!: ReflectionStats | null;

        get stats(): StatWidgetData[] {
            const memberStats = this.reflectionStats;
            if (!memberStats) {
                return []
            }

            const stats: StatWidgetData[] = [];

            // if (memberStats.currentStreakDays > 1) {
            //     stats.push({
            //         value: `${ memberStats.currentStreakDays }`,
            //         label: "Streak",
            //         unit: "Days",
            //         icon: "flame"
            //     })
            // } else if (memberStats.currentStreakWeeks > 1) {
            //     stats.push({
            //         value: `${ memberStats.currentStreakWeeks }`,
            //         label: "Streak",
            //         unit: "Weeks",
            //         icon: "flame"
            //     })
            // } else if (memberStats.currentStreakMonths > 1) {
            //     stats.push({
            //         value: `${ memberStats.currentStreakMonths }`,
            //         label: "Streak",
            //         unit: "Months",
            //         icon: "flame"
            //     })
            // }

            stats.push({
                value: `${ memberStats.totalCount }`,
                label: "Reflections",
                unit: "",
                icon: "journal"
            });

            let totalDuration = memberStats.totalDurationMs ?? 0;
            let durationValue = `${ totalDuration.toFixed(0) }`;
            let durationLabel = "Seconds";
            if (totalDuration <= (60 * 1000)) {
                durationValue = `${ Math.round(totalDuration / 1000) }`;
                durationLabel = this.copy.prompts.SECONDS
                if (durationValue === "1") {
                    durationLabel = this.copy.prompts.SECOND
                }
            } else {
                durationLabel = this.copy.prompts.MINUTES;
                durationValue = millisecondsToMinutes(totalDuration, 0);
                if (durationValue === "1") {
                    durationLabel = this.copy.common.MINUTE
                }
            }

            stats.push({ value: durationValue, label: "Duration", unit: durationLabel, icon: "clock" });

            return stats;
        }

    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .statsContainer {
        animation: .3s ease-in slideX;
        display: flex;
        margin: 0 -2.4rem 1.6rem 2.4rem;
        overflow: auto;
        padding-bottom: 1.6rem;

        @include r(374) {
            margin: 0 -2.4rem 1.6rem;
            padding-left: 2.4rem;
        }
        @include r(600) {
            animation: none;
        }
        @include r(960) {
            margin: 0 0 2.4rem;
            overflow: visible;
            padding: 0 0 2.4rem;
        }
    }
</style>
