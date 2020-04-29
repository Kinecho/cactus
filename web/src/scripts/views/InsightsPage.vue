<template>
    <div>
        <NavBar/>
        <template v-if="authLoaded">
            <h1>Member Insights</h1>

            <section class="stats">
                <p>Your stats</p>
                <div class="stats-wrapper">
                    <div class="stat" v-for="(stat, index) in stats" :key="`stat_${index}`">
                        <span class="value">{{stat.value}}</span>
                        <span class="label">{{stat.label}}</span>
                    </div>
                </div>
            </section>

            <section v-if="hasWordCloud">
                <p>Words you have used recently</p>
                <WordCloud v-if="hasWordCloud" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
            </section>
            <section v-else>
                <h2>Get the word cloud!</h2>
            </section>

            <section v-if="hasCoreValues">
                <p>Your core values are</p>
                <ul class="core-values-list">
                    <li v-for="(coreValue, index) in coreValues" :key="`value_${index}`" class="core-value">
                        <span class="title">{{coreValue.value}}</span>
                        <span class="description">{{coreValue.description}}</span>
                    </li>
                </ul>
                <router-link tag="button" :to="coreValuesHref" class="btn primary">Retake the assessment</router-link>
            </section>
            <section v-else>
                <h3>Get your core values!</h3>
                <button class="btn primary">Core Values</button>
            </section>

        </template>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import NavBar from "@components/NavBar.vue";
    import WordCloud from "@components/MemberWordCloudInsights.vue";
    import CactusMember from "@shared/models/CactusMember";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import CactusMemberService from "@web/services/CactusMemberService";
    import { InsightWord } from "@shared/models/ReflectionResponse";
    import { CoreValue, CoreValueMeta, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { PageRoute } from "@shared/PageRoutes";
    import { QueryParam } from "@shared/util/queryParams";
    import { millisecondsToMinutes } from "@shared/util/DateUtil";
    import CopyService from "@shared/copy/CopyService";

    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            NavBar,
            WordCloud
        }
    })
    export default class InsightsPage extends Vue {
        authLoaded = false;
        member?: CactusMember;
        memberObserver?: ListenerUnsubscriber;

        beforeMount() {
            this.memberObserver = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({ member }) => {
                    this.member = member;
                    this.authLoaded = true;
                }
            })
        }

        get wordCloud(): InsightWord[] {
            return this.member?.wordCloud ?? [];
        }

        get hasWordCloud(): boolean {
            return (this.wordCloud.length ?? 0) > 0;
        }

        get coreValues(): CoreValueMeta[] {
            return (this.member?.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        }

        get hasCoreValues(): boolean {
            return (this.member?.coreValues?.length ?? 0) > 0;
        }

        get coreValuesHref(): string {
            return `${ PageRoute.CORE_VALUES }?${ QueryParam.CV_LAUNCH }=true`;
        }

        get stats(): { value: string, label: string }[] {
            const memberStats = this.member?.stats?.reflections;
            if (!memberStats) {
                return []
            }

            const stats: { value: string, label: string }[] = [];

            stats.push({ value: `${ memberStats.totalCount }`, label: "Reflections" });

            if (memberStats.currentStreakDays > 1) {
                stats.push({ value: `${ memberStats.currentStreakDays }`, label: "Day Streak" })
            } else if (memberStats.currentStreakWeeks > 1) {
                stats.push({ value: `${ memberStats.currentStreakWeeks }`, label: "Week Streak" })
            } else if (memberStats.currentStreakMonths > 1) {
                stats.push({ value: `${ memberStats.currentStreakMonths }`, label: "Month Streak" })
            }

            let totalDuration = memberStats.totalDurationMs ?? 0;
            let durationValue = `${ totalDuration.toFixed(0) }`;
            let durationLabel = "Seconds";
            if (totalDuration < (60 * 1000)) {
                durationValue = `${ Math.round(totalDuration / 1000) }`;
                durationLabel = copy.prompts.SECONDS
            } else {
                durationLabel = copy.prompts.MINUTES;
                durationValue = millisecondsToMinutes(totalDuration);
            }

            stats.push({ value: durationValue, label: durationLabel });

            return stats;
        }

    }
</script>

<style scoped lang="scss">
    @import "variables";

    section {
        border: 1px solid black;
    }

    .stats {
        .stats-wrapper {
            display: flex;
            flex-direction: row;
            overflow: auto;
        }

        .stat {
            display: flex;
            flex-direction: column;
            border: 1px solid green;
            margin-right: 1rem;
            min-width: 350px;
            justify-content: center;
            align-items: center;
            text-align: center;

            .value {
                font-size: 3rem;
                font-weight: bold;
            }

            .label {
                font-size: 2rem;
            }
        }
    }

    .core-values-list {
        .core-value {
            display: flex;
            flex-direction: column;

            .title {
                color: $indigo;
            }

            .description {
                color: $lightText;
            }
        }

    }
</style>