<template>
    <div class="insightsDash">
        <NavBar/>
        <div class="centered" v-if="authLoaded">
            <h1>Insights</h1>

            <!--TO REMOVE - For testing only -->
            <h2 v-if="focusElement" :style="{color: 'blue', fontSize: '5rem'}">Your focus is:
                <strong :style="{color: 'red', fontSize: '6rem'}">{{focusElement}}</strong></h2>

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
                <router-link tag="button" class="esButton" :to="coreValuesHref">Get My Core Values</router-link>
            </section>

            <div class="flexSections">
                <!--                <section v-if="showGapResults && gapAssessmentResults" class="gapContainer borderContainer">-->
                <!--                    <h2>Happiness Quiz</h2>-->
                <!--                    <p class="subtext">The comparison of what you find <strong class="pink">important</strong> and what-->
                <!--                        you find <strong class="blue">satisfactory</strong></p>-->
                <!--                    <spinner v-if="gapResultsLoading" message="Loading Results..." :delay="1200"/>-->
                <!--                    <Results v-if="!gapResultsLoading && gapAssessmentResults"-->
                <!--                            :results="gapAssessmentResults"-->
                <!--                            :selectable-elements="selectFocusEnabled"-->
                <!--                            :pulsing-enabled="selectFocusEnabled"-->
                <!--                            :hideElements="false"-->
                <!--                            :selected-element="radarChartSelectedElement"-->
                <!--                            @elementSelected="elementSelected"-->
                <!--                             :withLabel="false"-->
                <!--                    />-->
                <!--                    <div class="gapFocus" v-if="focusElement">-->
                <!--                        <ResultElement :element="focusElement" :selectable="false" :with-label="false" :withCircle="true"/>-->
                <!--                        <div class="flexIt">-->
                <!--                            <p class="statLabel">Focus</p>-->
                <!--                            <p class="focusElement">{{focusElement}}</p>-->
                <!--                        </div>-->
                <!--                    </div>-->
                <!--                    <div v-if="selectFocusEnabled" class="gapActions">-->
                <!--                        <p>Tap a cactus to choose a focus.</p>-->
                <!--                        <p v-if="currentElementSelection">-->
                <!--                            You've selected: {{currentElementSelection || 'nothing yet'}}-->
                <!--                        </p>-->
                <!--                        <button class="small secondary" @click="cancelSetFocus">Cancel</button>-->
                <!--                        <button class="small" @click="saveFocus">Done</button>-->

                <!--                    </div>-->
                <!--                    <p v-else-if="focusElement && !selectFocusEnabled" class="gapActions">-->
                <!--                        Your focus is <strong>{{focusElement}}</strong>. To change your focus...-->
                <!--                        &lt;!&ndash;                        <router-link :to="setFocusPath" tag="button">Click Here</router-link>&ndash;&gt;-->
                <!--                        <button class="secondary small" @click="selectFocusEnabled = true">Change your focus</button>-->
                <!--                    </p>-->
                <!--                    <p v-else-if="!selectFocusEnabled" class="gapActions">-->
                <!--                        <button class="secondary small" @click="selectFocusEnabled = true">Choose a focus</button>-->
                <!--                    </p>-->
                <!--                    <dropdown-menu :items="mentalFitnessDropdownLinks" class="dotsBtn"/>-->
                <!--                </section>-->
                <!--                &lt;!&ndash; Show PLUS User Empty State message &ndash;&gt;-->
                <!--                <section v-else-if="isPlusMember" class="nogapContainer borderContainer">-->
                <!--                    <h2>Happiness Quiz</h2>-->
                <!--                    <p class="subtext">Find the gap between what is important to you and how satisfied you are regarding-->
                <!--                        that area of your&nbsp;life.</p>-->
                <!--                    <router-link tag="button" class="esButton" :to="gapAssessmentHref">Take the-->
                <!--                        <span>Mental Fitness</span> Quiz-->
                <!--                    </router-link>-->
                <!--                </section>-->
                <!--                &lt;!&ndash; Show BASIC User Upgrade message &ndash;&gt;-->
                <!--                <section v-else-if="!isPlusMember" class="nogapContainer borderContainer">-->
                <!--                    <h2>Happiness Quiz</h2>-->
                <!--                    <p class="subtext">NEEDS WORK To choose your focus, upgrade to Cactus Plus </p>-->
                <!--                    <router-link tag="button" class="esButton" :to="pricingHref">Try Cactus Plus-->
                <!--                    </router-link>-->
                <!--                </section>-->


                <gap-analysis-widget :loading="gapResultsLoading"
                        :gap-assessment-results="gapAssessmentResults"
                        :is-plus-member="isPlusMember"
                        :member-focus-element="focusElement"
                />

                <section class="bubblesContainer borderContainer" v-if="hasWordCloud">
                    <div class="flexIt">
                        <h2>Word Bubbles</h2>
                        <p class="subtext">The words used most in your daily reflections</p>
                    </div>
                    <WordCloud class="word-cloud graph" v-if="hasWordCloud" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
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
    import WordCloud from "@components/MemberWordCloudInsights.vue";
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
    import { pushRoute } from "@web/NavigationUtil";
    import Results from "@components/gapanalysis/Results.vue";
    import ResultElement from "@components/gapanalysis/ResultElement.vue";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import GapAnalysisService from "@web/services/GapAnalysisService";
    import Spinner from "@components/Spinner.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import { Screen } from "@components/gapanalysis/GapAssessmentTypes";
    import GapAnalysisWidget from "@components/insights/GapAnalysisWidget.vue";

    const logger = new Logger("InsightsPage");
    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            GapAnalysisWidget,
            Results,
            ResultElement,
            NavBar,
            Footer,
            WordCloud,
            DropdownMenu,
            Spinner,
        }
    })
    export default class InsightsPage extends Vue {
        authLoaded = false;
        member: CactusMember | null = null;
        memberObserver?: ListenerUnsubscriber;
        gapResultsLoading = false;
        gapAssessmentResults?: GapAnalysisAssessmentResult | null = null;
        selectFocusEnabled = false;
        currentElementSelection: CactusElement | null = null

        beforeMount() {
            this.memberObserver = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({ member }) => {
                    this.member = member ?? null;

                    if (!member) {
                        await pushRoute(PageRoute.HOME);
                    } else {
                        this.authLoaded = true;
                        await this.fetchGapResults();
                    }
                }
            })
        }

        async fetchGapResults() {
            if (this.gapResultsLoading || !this.member?.id) {
                return;
            }
            this.gapResultsLoading = true;

            const results = await GapAnalysisService.sharedInstance.getLatestForMember(this.member.id)
            this.gapAssessmentResults = results ?? null;
            this.gapResultsLoading = false;
        }

        async elementSelected(element: CactusElement | null) {
            this.currentElementSelection = element;
        }

        async saveFocus() {
            if (this.member) {
                this.member.focusElement = this.currentElementSelection;
                await CactusMemberService.sharedInstance.setFocusElement({
                    element: this.currentElementSelection,
                    member: this.member
                })
            }
            this.selectFocusEnabled = false;
            this.currentElementSelection = null;
        }

        cancelSetFocus() {
            this.selectFocusEnabled = false;
            this.currentElementSelection = null;
        }

        get coreValuesBlob(): CoreValuesBlob | undefined {
            if (!this.authLoaded || !this.member) {
                return undefined;
            }
            const forceIndex = getQueryParam(QueryParam.BG_INDEX)
            logger.info("Forcing index: ", forceIndex);
            const blob = getCoreValuesBlob(this.member?.coreValues, forceIndex);
            logger.info("Blob info:", blob);
            return blob;
        }

        get radarChartSelectedElement(): CactusElement | null {
            if (this.selectFocusEnabled) {
                return this.currentElementSelection;
            }
            return this.focusElement;
        }

        get wordCloud(): InsightWord[] {
            return (this.authLoaded && this.member) ? (this.member?.wordCloud ?? []) : [];
        }

        get hasWordCloud(): boolean {
            return (this.wordCloud.length ?? 0) > 0;
        }

        get coreValues(): CoreValueMeta[] {
            if (!this.authLoaded || !this.member) {
                return [];
            }
            return (this.member.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        }

        get hasCoreValues(): boolean {
            return (this.authLoaded && !!this.member) && isPremiumTier(this.member?.tier) && ((this.member?.coreValues?.length ?? 0) > 0);
        }

        get coreValuesHref(): string {
            return `${ PageRoute.CORE_VALUES }?${ QueryParam.CV_LAUNCH }=true`;
        }

        get setFocusPath(): string | undefined {
            if (this.gapAssessmentResults) {
                return `${ PageRoute.GAP_ANALYSIS }/${ this.gapAssessmentResults.id }/${ Screen.chooseFocus }`
            }
            return undefined;
        }

        get gapAssessmentHref(): string {
            return PageRoute.GAP_ANALYSIS;
        }

        get showGapResults(): boolean {
            return !!(this.isPlusMember && this.gapAssessmentResults);
        }

        get isPlusMember(): boolean {
            return this.authLoaded && !!this.member?.tier && isPremiumTier(this.member.tier);
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

        get pricingHref(): string {
            return PageRoute.PRICING;
        }

        get mentalFitnessDropdownLinks(): DropdownMenuLink[] {
            return [{
                title: "Retake Quiz",
                href: PageRoute.GAP_ANALYSIS,
            }];
        }

        get fakeGapAnalysisResults(): GapAnalysisAssessmentResult {
            return GapAnalysisAssessmentResult.mock();
        }

        get focusElement(): CactusElement | null {
            if (!this.authLoaded || !this.member) {
                return null;
            }
            return this.member.focusElement ?? null;
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
        background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg);
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
            opacity: .8;
        }
    }

    .esButton {
        display: block;
        flex-grow: 0;
        white-space: nowrap;

        @include r(960) {
            width: 100%;
        }

        span {
            display: none;

            @include r(374) {
                display: inline;
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
            }
            @include r(768) {
                align-items: flex-start;
                flex-direction: row;
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
            margin-top: -16rem;
            transform: translate(60%, 0);
            position: absolute;
        }
        @include r(600) {
            margin-bottom: -4.8rem;
            margin-top: -14rem;
            max-width: 38rem;
            position: relative;
            transform: none;
            width: 100%;
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
            height: 34rem;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: 34rem;

            @include r(600) {
                height: 37rem;
                width: 37rem;
            }
        }

        img {
            position: relative;
            width: 29rem;

            @include r(600) {
                width: 100%;
            }
            @include r(768) {
                width: 32rem;
            }
        }
    }

    .core-values-list {
        list-style: none;
        margin: 2.4rem 0;
        width: 50%;
        padding: 0;

        @include r(768) {
            display: flex;
            flex-flow: row wrap;
            margin: 0;
            width: auto;
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
        position: relative;

        @include r(600) {
            align-items: flex-start;
            display: flex;
            flex-direction: column;
        }
        @include r(768) {
            display: block;
            margin-bottom: 4.8rem;
            width: 49%;
        }
        @include r(960) {
            display: flex;
        }

        .subtext {
            margin: 0 0 2.4rem;
            opacity: .8;

            @include r(600) {
                margin: 0 3.2rem 2.4rem 0;
                max-width: 17rem;
            }
            @include r(768) {
                max-width: 60rem;
            }
        }
    }

    .gapFocus {
        align-items: center;
        border-top: 1px solid $lightest;
        display: flex;
        margin: 4rem -3.2rem 0;
        padding: 3.2rem 3.2rem 0;
        width: calc(100% + 6.4rem);

        .flexIt {
            margin-left: 1.6rem;
        }
    }

    .focusElement {
        font-size: 2rem;
        font-weight: bold;
        text-transform: capitalize;
    }

    .pink {
        color: $magenta;
    }

    .blue {
        color: $royal;
    }

    .analysisResults {
        margin: -4rem auto auto;
        max-width: 38rem;
        width: 100%;

        @include r(600) {
            margin-right: 0;
            margin-top: -20rem;
            position: relative;
        }
        @include r(768) {
            margin-right: auto;
            margin-top: -4rem;
        }
    }

    .gapContainer + .bubblesContainer {
        flex-flow: column wrap;

        .chart-container {
            margin: 0 auto;
            max-width: 40rem;
            width: 100%;

            @include r(600) {
                margin-right: 0;
                margin-top: -12rem;
                position: relative;
            }
            @include r(768) {
                margin-right: auto;
                margin-top: 0;
            }
        }
    }

    .nogapContainer + .bubblesContainer {
        flex-flow: row nowrap;

        .subtext {
            @include r(600) {
                max-width: 24rem;
            }
        }

        .chart-container {
            @include r(600) {
                margin: -4.8rem -4.8rem -4.8rem 0;
            }
        }
    }

    .nogapContainer {
        @include shadowbox;
        background-color: lighten($dolphin, 5%);
        background-image: url(/assets/images/grainy.png),
        url(/assets/images/crosses2.svg),
        url(/assets/images/outlineBlob.svg),
        url(/assets/images/royalBlob.svg),
        url(/assets/images/pinkBlob5.svg);
        background-position: 0 0, 39rem -1rem, -34rem -84rem, -5rem 23rem, -17rem -32rem;
        background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;
        background-size: auto, 40%, 200%, 100%, 100%;
        color: $white;
        position: relative;

        h2 {
            margin-bottom: .4rem;
        }
    }

    .gapActions {
        margin: 2rem 0;
    }

</style>
