<template>
    <div class="insightsDash">
        <NavBar/>
        <div class="centered" v-if="authLoaded">
            <h1>Insights</h1>

            <section class="statsContainer">
                <div class="stat" v-for="(stat, index) in stats" :key="`stat_${index}`">
                    <div class="statIcon">
                        <img :src="`/assets/images/${stat.icon}.svg`" :alt="`${stat.label} icon`"/>
                    </div>
                    <div class="textContainer">
                        <p class="statLabel">{{stat.label}}</p>
                        <p class="statValue">{{stat.value}}<span class="unit">{{stat.unit}}</span></p>
                    </div>
                </div>
            </section>

            <section class="valuesContainer" v-if="hasCoreValues">
                <h2>Core Values</h2>
                <p class="subtext">What’s most important for you</p>
                <div class="flexIt">
                    <div class="imgContainer" v-if="coreValuesBlob">
                        <img :src="coreValuesBlob.imageUrl" alt="Core Values Graphic"/>
                    </div>
                    <ul class="core-values-list">
                        <li v-for="(coreValue, index) in coreValues" :key="`value_${index}`" class="core-value">
                            <p class="title">{{coreValue.value}}</p>
                            <p class="description">{{coreValue.description}}</p>
                        </li>
                    </ul>
                </div>

                <dropdown-menu :items="coreValuesDropdownLinks" class="dotsBtn"/>
            </section>
            <section class="novaluesContainer" v-else>
                <h2>Core Values</h2>
                <p class="subtext">What is most important for you so that you better understand past decisions and make
                    better decisions in the future.</p>
                <router-link tag="button" class="cvButton" :to="coreValuesHref">Get My Core Values</router-link>
            </section>

            <div class="flexSections">
                <section class="gapContainer borderContainer">
                    <div class="gapText">
                        <p class="subtext light">Coming Soon</p>
                        <h2>Gap Analysis</h2>
                        <p class="subtext">Find the gap between where you spend your time on and what you're committed&nbsp;to.</p>
                    </div>
                    <img class="gapAnalysisImg" src="assets/images/gapAnalysis.svg" alt="gap analysis example"/>
                </section>
                <section class="bubblesContainer borderContainer">
                    <div class="flexIt">
                        <p class="subtext light" v-if="!isPlusMember">Cactus Plus Feature</p>
                        <h2>Word Bubbles</h2>
                        <p class="subtext" v-if="isPlusMember">These are the words used most in your daily
                            reflections.</p>
                        <p class="subtext" v-else>Discover the most used words in your daily reflections.</p>
                        <p class="subtext" v-if="isPlusMember && !hasWordCloud">When you write in your daily
                            reflections, this chart will come to life. </p>
                        <router-link :to="pricingRoute" v-if="!isPlusMember">Try Plus for Free</router-link>
                    </div>
                    <WordCloud class="word-cloud graph" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
                </section>
            </div>

        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import Footer from "@components/StandardFooter.vue";
    import NavBar from "@components/NavBar.vue";
    import WordCloud from "@components/InsightWordChart.vue";
    import CactusMember from "@shared/models/CactusMember";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import CactusMemberService from "@web/services/CactusMemberService";
    import { InsightWord } from "@shared/models/ReflectionResponse";
    import { CoreValueMeta, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { PageRoute } from "@shared/PageRoutes";
    import { QueryParam } from "@shared/util/queryParams";
    import { millisecondsToMinutes } from "@shared/util/DateUtil";
    import CopyService from "@shared/copy/CopyService";
    import { DropdownMenuLink } from "@components/DropdownMenuTypes";
    import DropdownMenu from "@components/DropdownMenu.vue";
    import { CoreValuesBlob, getCoreValuesBlob } from "@shared/util/CoreValuesUtil";
    import { getQueryParam } from "@web/util";
    import Logger from "@shared/Logger"
    import { isPremiumTier } from "@shared/models/MemberSubscription";

    const logger = new Logger("InsightsPage");
    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            NavBar,
            Footer,
            WordCloud,
            DropdownMenu,
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

        get isPlusMember(): boolean {
            return isPremiumTier(this.member?.tier);
        }

        get coreValuesBlob(): CoreValuesBlob | undefined {
            const forceIndex = getQueryParam(QueryParam.BG_INDEX)
            logger.info("Forcing index: ", forceIndex);
            const blob = getCoreValuesBlob(this.member?.coreValues, forceIndex);
            logger.info("Blob info:", blob);
            return blob;
        }

        get pricingRoute(): string {
            return PageRoute.PRICING;
        }

        get wordCloud(): InsightWord[] {
            if (!this.isPlusMember) {
                return [{ word: "Believe", frequency: 1 }, { word: "toughness", frequency: 0.6 }, {
                    word: "love",
                    frequency: 0.7
                }]
            }
            return this.member?.wordCloud ?? [];
        }

        get hasWordCloud(): boolean {
            return (this.wordCloud.length ?? 0) > 0;
        }

        get coreValues(): CoreValueMeta[] {
            return (this.member?.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        }

        get hasCoreValues(): boolean {
            return isPremiumTier(this.member?.tier) && (this.member?.coreValues?.length ?? 0) > 0;
        }

        get coreValuesHref(): string {
            return `${ PageRoute.CORE_VALUES }?${ QueryParam.CV_LAUNCH }=true`;
        }

        get stats(): { value: string, label: string, unit: string, icon: string }[] {
            const memberStats = this.member?.stats?.reflections;
            if (!memberStats) {
                return []
            }

            const stats: { value: string, label: string, unit: string, icon: string }[] = [];

            stats.push({ value: `${ memberStats.totalCount }`, label: "Reflections", unit: "", icon: "journal" });

            if (memberStats.currentStreakDays > 1) {
                stats.push({
                    value: `${ memberStats.currentStreakDays }`,
                    label: "Streak",
                    unit: "Days",
                    icon: "flame"
                })
            } else if (memberStats.currentStreakWeeks > 1) {
                stats.push({
                    value: `${ memberStats.currentStreakWeeks }`,
                    label: "Streak",
                    unit: "Weeks",
                    icon: "flame"
                })
            } else if (memberStats.currentStreakMonths > 1) {
                stats.push({
                    value: `${ memberStats.currentStreakMonths }`,
                    label: "Streak",
                    unit: "Months",
                    icon: "flame"
                })
            }

            let totalDuration = memberStats.totalDurationMs ?? 0;
            let durationValue = `${ totalDuration.toFixed(0) }`;
            let durationLabel = "Seconds";
            if (totalDuration < (60 * 1000)) {
                durationValue = `${ Math.round(totalDuration / 1000) }`;
                durationLabel = copy.prompts.SECONDS
            } else {
                durationLabel = copy.prompts.MINUTES;
                durationValue = millisecondsToMinutes(totalDuration, 0);
            }

            stats.push({ value: durationValue, label: "Duration", unit: durationLabel, icon: "clock" });

            return stats;
        }

        get coreValuesDropdownLinks(): DropdownMenuLink[] {
            return [{
                title: "Retake Assessment",
                href: `${ PageRoute.CORE_VALUES }?=${ QueryParam.CV_LAUNCH }=true`,
            }];
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
            margin: 3.2rem 0;

            @include r(768) {
                margin: 6.4rem 0 4rem;
            }
        }

        h2 {
            font-size: 2rem;
            margin-bottom: .8rem;

            @include r(768) {
                font-size: 2.4rem;
            }
        }

        .subtext {
            font-size: 1.6rem;
            margin-bottom: .8rem;
            opacity: .8;

            @include r(768) {
                font-size: 1.8rem;
            }

            &.light {
                opacity: .4;
            }
        }
    }

    .statsContainer {
        display: flex;
        margin: 0 -2.4rem 2.4rem 0;
        overflow: auto;
        padding-bottom: 1.6rem;

        @include r(960) {
            margin: 0 0 2.4rem;
            overflow: visible;
            padding-bottom: 2.4rem;
        }
    }

    .stat {
        align-items: center;
        border: 1px solid $lightest;
        border-radius: 1.2rem;
        display: flex;
        flex-basis: 33%;
        margin-right: 1.6rem;
        padding: 3.2rem;

        @include r(960) {
            @include shadowbox;
            border: 0;
            flex-grow: 1;

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
    }

    .statValue {
        color: $green;
        font-size: 5.6rem;
        font-weight: bold;
        line-height: 1;
    }

    .unit {
        font-size: 1.8rem;
        padding-left: .8rem;

        &:empty {
            display: none;
        }
    }

    .novaluesContainer {
        @include shadowbox;
        background-color: $dolphin;
        background-image: url(assets/images/grainy.png), url(assets/images/cvBlob.png), url(assets/images/pinkVs.svg);
        background-position: 0 0, -14rem -15rem, -7rem 120%;
        background-repeat: repeat, no-repeat, no-repeat;
        background-size: auto, 28rem, auto;
        color: $white;
        margin-bottom: 4rem;
        padding: 3.2rem;
        position: relative;

        @include r(768) {
            background-position: 0 0, 100% -15rem, 98% 133%;
            background-size: auto, 40rem, auto;
            margin-bottom: 4.8rem;
        }

        h2 {
            font-size: 2.4rem;
            margin-bottom: .4rem;
        }

        .subtext {
            margin: 0 0 2.4rem;
            max-width: 60rem;
            opacity: .9;
        }

        .cvButton {
            display: block;

            @include r(960) {
                width: 100%;
            }
        }
    }

    .valuesContainer {
        background-color: lighten($beige, 3%);
        border-radius: 1.6rem;
        margin-bottom: 4rem;
        padding: 3.2rem;
        position: relative;

        @include r(768) {
            margin-bottom: 4.8rem;
        }

        .subtext {
            max-width: 17rem;

            @include r(960) {
                max-width: 16rem;
            }
        }

        .flexIt {
            @include r(600) {
                align-items: center;
                display: flex;
                flex-direction: row-reverse;
                justify-content: flex-end;
                max-width: 48rem;
            }
            @include r(768) {
                align-items: flex-start;
                flex-direction: row;
                max-width: none;
            }
            @include r(960) {
                margin-top: -4.8rem;
            }
        }
    }

    .imgContainer {
        margin-bottom: 2.4rem;
        position: relative;

        @include r(374) {
            margin-top: -12rem;
            transform: translate(60%, 0);
            position: absolute;
        }
        @include r(600) {
            margin-bottom: -4.8rem;
            position: relative;
            transform: none;
        }
        @include r(768) {
            margin-top: 3.2rem;
        }
        @include r(960) {
            margin-top: 0;
        }
        @include r(1024) {
            margin-top: -9.2rem;
        }

        &:before {
            background-image: radial-gradient($royal, rgba(101, 144, 237, 0) 60%);
            bottom: 0;
            content: '';
            display: block;
            height: 37rem;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: 37rem;
        }

        img {
            position: relative;
            width: 32rem;
        }
    }

    .core-values-list {
        list-style: none;
        margin: 2.4rem 0;
        min-width: 50%;
        padding: 0;

        @include r(768) {
            display: flex;
            flex-flow: row wrap;
            margin: 0;
            min-width: 0;
        }
        @include r(960) {
            max-width: 48.75%;
        }
    }

    .core-value {
        list-style: none;
        margin: 0 0 .8rem;
        padding: 0;

        @include r(768) {
            margin: 0 0 4rem;
            min-width: 20rem;
            padding-left: 3.2rem;
            width: 50%;
        }

        .title {
            color: darken($royal, 11%);
            font-size: 1.4rem;
            font-weight: bold;
            letter-spacing: 1px;
            opacity: .8;
            text-transform: uppercase;
            white-space: nowrap;
        }

        .description {
            display: none;

            @include r(768) {
                display: block;
                font-size: 1.6rem;
                opacity: .8;
            }
        }
    }

    .dotsBtn {
        position: absolute;
        right: 1rem;
        top: 1.6rem;
    }

    .flexSections {
        @include r(768) {
            display: flex;
            justify-content: space-between;
        }
    }

    .borderContainer {
        border: 1px solid $lightest;
        border-radius: 1.6rem;
        margin-bottom: 4rem;
        padding: 3.2rem;

        @include r(600) {
            align-items: flex-start;
            display: flex;
        }
        @include r(768) {
            display: block;
            margin-bottom: 4.8rem;
            width: 49%;
        }
        @include r(960) {
            display: flex;
        }
    }

    .gapText {
        @include r(768) {
            display: flex;
            flex-direction: column;
            margin-right: 3.2rem;

            .subtext.light {
                order: 3;
            }
        }
    }

    .gapAnalysisImg {
        display: block;
        margin: 2.4rem auto 0;
        max-width: 40rem;
        width: 100%;

        @include r(600) {
            margin: 0 0 0 2.4rem;
        }
        @include r(768) {
            margin: 0;
        }
        @include r(960) {
            min-width: 50%;
        }
    }

    .word-cloud {
        display: block;
        margin: 2.4rem auto 0;
        max-width: 40rem;

        @include r(600) {
            margin: -4.8rem -4.8rem -4.8rem 2.4rem;
        }
        @include r(768) {
            margin: 0;
        }
        @include r(960) {
            margin: -4.8rem -4.8rem -4.8rem 2.4rem;
            min-width: 66%;
        }
    }

</style>
