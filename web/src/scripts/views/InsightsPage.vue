<template>
    <div class="insightsDash">
        <NavBar/>
        <div class="centered" v-if="authLoaded">
            <h1>Insights</h1>

            <section class="statsContainer">
                <div class="stat" v-for="(stat, index) in stats" :key="`stat_${index}`">
                    <div class="statIcon">
                        <img src="assets/images/journal.svg" alt="" />
                    </div>
                    <div class="textContainer">
                        <p class="statLabel">{{stat.label}}</p>
                        <p class="statValue">{{stat.value}}</p>
                    </div>
                </div>
            </section>

            <section v-if="hasWordCloud">
                <p>Words you have used recently</p>
                <WordCloud class="word-cloud graph" v-if="hasWordCloud" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
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

            <section class="gap-analysis">
                <h3>Gap Analysis</h3>
                <p>Coming Soon</p>
            </section>

        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import Footer from "@components/StandardFooter.vue";
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
            Footer,
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
    @import "common";
    @import "mixins";
    @import "variables";

    .insightsDash {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;

        header, .centered {
            width: 100%;
        }

        .centered {
            flex-grow: 1;
            padding: 0 2.4rem 6.4rem;
            text-align: left;
        }

        h1 {
            margin: 3.2rem 0 1.6rem;

            @include r(768) {
                margin: 6.4rem 0 1.6rem;
            }
        }
    }

    .statsContainer {
        display: flex;
        margin: 0 -2.4rem 1.6rem 0;
        overflow: auto;
        padding-bottom: 1.6rem;

        @include r(768) {
            overflow: visible;
        }
    }

    .stat {
        align-items: center;
        border: 1px solid $lightest;
        border-radius: 1.2rem;
        display: flex;
        margin-right: 1.6rem;
        min-width: 28rem;
        padding: 2.4rem;

        @include r(768) {
            @include shadowbox;
            border: 0;
            flex-grow: 1;
            padding: 3.2rem;

            &:last-child {
                margin-right: 0;
            }
        }
    }

    .statIcon {
        align-items: center;
        background-color: lighten($beige, 3%);
        border-radius: 50%;
        display: flex;
        flex-shrink: 0;
        height: 8rem;
        justify-content: center;
        margin-right: 1.6rem;
        width: 8rem;

        img {
            height: 3.2rem;
            width: 3.2rem;
        }
    }

    .statLabel {
        color: $lightText;
        font-size: 1.6rem;
        white-space: nowrap;
    }

    .statValue {
        color: $green;
        font-size: 5.6rem;
        font-weight: bold;
        line-height: 1;
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

    .graph {
        max-width: 40rem;
    }
</style>
