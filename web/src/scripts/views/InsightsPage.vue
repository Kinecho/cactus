<template>
    <div class="insightsDash">
        <div class="centered">
            <h1 v-if="!loading" :class="showEmptyState ? 'center' : '' ">{{welcomeMessage}}</h1>
            <div v-if="loading">
                <spinner :delay="1500" message="Loading..."/>
            </div>
            <div v-else-if="showEmptyState">
                <EmptyState :tier="member.tier"/>
            </div>
            <div v-else class="insightsGrid">
                <reflection-stats-widget :reflection-stats="reflectionStats" v-if="reflectionStats"/>
                <prompt-widget :entry="todayEntry" :member="member" :loading="todayPromptLoading"/>
                <section class="bubblesContainer" v-if="hasWordCloud">
                    <div class="flexIt">
                        <h2>Word Bubbles</h2>
                    </div>
                    <div class="wordCloud">
                        <WordCloud class="word-cloud graph" v-if="hasWordCloud" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
                    </div>
                </section>
                <section class="valuesContainer" v-if="hasCoreValues">
                    <h2>Core Values</h2>
                    <div class="flexIt">
                        <ul class="core-values-list">
                            <li v-for="(coreValue, index) in coreValues" :key="`value_${index}`" class="core-value">
                                <h3>{{coreValue.value}}</h3>
                                <!-- <p class="description">{{coreValue.description}}</p> -->
                            </li>
                        </ul>
                        <div class="imgContainer" v-if="coreValuesBlob">
                            <img :src="coreValuesBlob.imageUrl" alt="Core Values Graphic"/>
                        </div>
                    </div>
                    <dropdown-menu :items="coreValuesDropdownLinks" class="dotsBtn"/>
                </section>
                <router-link v-else tag="section" class="novaluesContainer" :class="{plus: isPlusMember}" :to="coreValuesHref">
                    <svg class="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <h2>What Are Your Core Values?</h2>
                    <p class="subtext">Discover what drives your life decisions and deepest needs.</p>
                    <router-link v-if="isPlusMember" tag="button" class="secondary esButton" :to="coreValuesHref">Take
                        the Assessment
                    </router-link>
                </router-link>
                <gap-analysis-widget :loading="gapResultsLoading"
                        :gap-assessment-results="gapAssessmentResults"
                        :is-plus-member="isPlusMember"
                        :member-focus-element="focusElement"
                        @focusElement="saveFocus"
                />
            </div>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import Footer from "@components/StandardFooter.vue";
    import WordCloud from "@components/MemberWordCloudInsights.vue";
    import CactusMember, { ReflectionStats } from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";
    import { CoreValueMeta, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { PageRoute } from "@shared/PageRoutes";
    import { QueryParam } from "@shared/util/queryParams";
    import CopyService from "@shared/copy/CopyService";
    import { DropdownMenuLink } from "@components/DropdownMenuTypes";
    import DropdownMenu from "@components/DropdownMenu.vue";
    import { CoreValuesBlob, getCoreValuesBlob } from "@shared/util/CoreValuesUtil";
    import { getQueryParam } from "@web/util";
    import Logger from "@shared/Logger"
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import Results from "@components/gapanalysis/Results.vue";
    import ResultElement from "@components/gapanalysis/ResultElement.vue";
    import GapAnalysisAssessmentResult from "@shared/models/GapAnalysisAssessmentResult";
    import GapAnalysisService from "@web/services/GapAnalysisService";
    import Spinner from "@components/Spinner.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import GapAnalysisWidget from "@components/insights/GapAnalysisWidget.vue";
    import ReflectionStatsWidget from "@components/insights/ReflectionStatsWidget.vue";
    import { logFocusElementSelected } from "@web/analytics";
    import { InsightWord } from "@shared/api/InsightLanguageTypes";
    import PromptWidget from "@components/insights/PromptWidget.vue";
    import JournalEntry from "@web/datasource/models/JournalEntry";
    import SvgIcon from "@components/SvgIcon.vue";
    import { Prop } from "vue-property-decorator";
    import JournalFeedDataSource, { JournalFeedDataSourceDelegate } from "@web/datasource/JournalFeedDataSource";
    import MemberHomeEmptyState from "@components/MemberHomeEmptyState.vue";

    const logger = new Logger("InsightsPage");
    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            EmptyState: MemberHomeEmptyState,
            PromptWidget,
            ReflectionStatsWidget,
            GapAnalysisWidget,
            Results,
            ResultElement,
            Footer,
            WordCloud,
            DropdownMenu,
            Spinner,
            SvgIcon,
        }
    })
    export default class InsightsPage extends Vue implements JournalFeedDataSourceDelegate {

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        gapResultsLoading = false;
        gapAssessmentResults?: GapAnalysisAssessmentResult | null = null;
        selectFocusEnabled = false;
        currentElementSelection: CactusElement | null = null
        todayEntry: JournalEntry | null = null;
        todayLoaded = false;
        dataSource?: JournalFeedDataSource
        journalLoaded: boolean = false;
        showEmptyState: boolean = false;

        async beforeMount() {
            this.dataSource = JournalFeedDataSource.setup(this.member, { onlyCompleted: true, delegate: this })
            await this.dataSource?.start()
            await this.fetchGapResults()
        }

        destroyed() {
            this.todayEntry?.stop();
        }

        get todayPromptLoading(): boolean {
            return !this.todayEntry && !this.todayLoaded;
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

        async saveFocus(element: CactusElement | null) {
            if (this.member) {
                this.member.focusElement = element;
                logFocusElementSelected(element);
                await CactusMemberService.sharedInstance.setFocusElement({
                    element,
                    member: this.member
                })
            }
        }

        cancelSetFocus() {
            this.selectFocusEnabled = false;
            this.currentElementSelection = null;
        }

        get welcomeMessage(): string {
            if (getQueryParam(QueryParam.FROM) === "onboarding") {
                return "Welcome to Cactus!"
            }
            if (this.showEmptyState) {
                return "Welcome!"
            }
            const greeting = "Welcome back";
            const displayName = this.displayName;
            return `${ greeting }${ displayName ? ', ' + displayName : '' }`
        }

        get loading(): boolean {
            return !this.journalLoaded
        }

        get displayName(): string | undefined {
            return this.member?.firstName;
        }

        get coreValuesBlob(): CoreValuesBlob | undefined {
            if (!this.member) {
                return undefined;
            }
            const forceIndex = getQueryParam(QueryParam.BG_INDEX)
            logger.info("Forcing index: ", forceIndex);
            const blob = getCoreValuesBlob(this.member?.coreValues, forceIndex);
            logger.info("Blob info:", blob);
            return blob;
        }

        get wordCloud(): InsightWord[] {
            return (this.member) ? (this.member?.wordCloud ?? []) : [];
        }

        get hasWordCloud(): boolean {
            return (this.wordCloud.length ?? 0) > 0;
        }

        get coreValues(): CoreValueMeta[] {
            if (!this.member) {
                return [];
            }
            return (this.member.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        }

        get hasCoreValues(): boolean {
            return (!!this.member) && isPremiumTier(this.member?.tier) && ((this.member?.coreValues?.length ?? 0) > 0);
        }

        get coreValuesHref(): string {
            return `${ PageRoute.CORE_VALUES }?${ QueryParam.CV_LAUNCH }=true`;
        }

        get isPlusMember(): boolean {
            return !!this.member?.tier && isPremiumTier(this.member.tier);
        }

        get reflectionStats(): ReflectionStats | undefined {
            return this.member?.stats.reflections;
        }

        get coreValuesDropdownLinks(): DropdownMenuLink[] {
            return [{
                title: "Retake Assessment",
                href: `${ PageRoute.CORE_VALUES }?${ QueryParam.CV_LAUNCH }=true`,
            }];
        }

        get focusElement(): CactusElement | null {
            return this.member.focusElement ?? null;
        }

        /* START: JOURNAL FEED DATA SOURCE DELEGATE */
        didLoad(hasData: boolean): void {
            logger.info("Insights page data source did load");
            this.journalLoaded = true;
            this.todayEntry = this.dataSource?.todayEntry ?? null;
            this.showEmptyState = !hasData;
        }

        todayEntryUpdated(entry?: JournalEntry | null) {
            logger.info("Insights today entry loaded");
            this.todayEntry = entry ?? null;
            this.todayLoaded = true;
        }

        /* END: JOURNAL FEED DATA SOURCE DELEGATE */
    }
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "insights";

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
            padding: 0 0 6.4rem;
            text-align: left;

            @include r(374) {
                padding: 0 2.4rem 6.4rem;
            }
        }
    }

    h1 {
        margin: 3.2rem 2.4rem;

        @include r(374) {
            margin: 3.2rem 0;
        }
        @include r(768) {
            margin: 6.4rem 0 4rem;
        }

        &.center {
            margin-bottom: 0;
            text-align: center;
        }
    }

    .insightsGrid {
        @include r(768) {
            display: grid;
            grid-template-areas: "stats stats stats stats stats stats"
                "today today today today bubbles bubbles"
                "values values values gap gap gap";
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
            grid-template-rows: auto;

            .statsContainer {
                grid-area: stats;
            }
            .today-widget {
                grid-area: today;
            }
            .bubblesContainer {
                grid-area: bubbles;
            }
            .novaluesContainer,
            .valuesContainer {
                grid-area: values;
            }
            .nogapContainer,
            .gapContainer {
                grid-area: gap;
            }
        }
    }

    .novaluesContainer {
        background-color: $dolphin;
        background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg);
        background-position: 0 0, -17rem -7rem, right -6rem top -4rem;
        background-repeat: repeat, no-repeat, no-repeat;
        background-size: auto, 28rem, auto;
        border-radius: 1.6rem;
        color: $white;
        cursor: pointer;
        padding: 2.4rem 3.2rem 3.2rem 5.6rem;
        position: relative;

        @include r(600) {
            transition: box-shadow .3s, transform .3s ease-in;

            &:hover {
                box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.012),
                0 11.5px 32.3px -24px rgba(0, 0, 0, 0.036),
                0 13.9px 37.7px -24px rgba(0, 0, 0, 0.074),
                0 24px 63px -24px rgba(0, 0, 0, 0.15);
                transform: translateY(-.2rem);
            }
        }

        &.plus {
            padding-left: 3.2rem;

            @include r(600) {
                background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg), url(/assets/images/cvBlob.png);
                background-position: 0 0, -17rem -7rem, right -6rem top -4rem, right -6rem bottom -14rem;
                background-repeat: repeat, no-repeat, no-repeat, no-repeat;
                background-size: auto, 28rem, auto, auto;

                .subtext {
                    font-size: 1.8rem;
                }

                .subtext + button {
                    display: block;
                    margin-top: 2.4rem;
                    width: auto;
                }

                button:hover {
                    background-color: $white;
                }
            }

            .lock,
            button {
                display: none;
            }
        }

        .subtext {
            max-width: 56rem;
            opacity: .8;
        }
    }

    .novaluesContainer,
    .valuesContainer {
        margin: 0 2.4rem 3.2rem;

        @include r(374) {
            margin: 0 0 3.2rem;
        }
        @include r(768) {
            margin: 0 1.6rem 4.8rem 0;
        }
    }

    .valuesContainer {
        border: 1px solid $lightest;
        border-radius: 1.6rem;
        padding: 2.4rem;
        position: relative;

        @include r(374) {
            padding: 2.4rem 3.2rem;
        }
        @include r(768) {
            display: flex;
            flex-direction: column;
            margin-bottom: 4.8rem;
        }

        h2 {
            @include r(768) {
                margin-bottom: 3.2rem;
            }
            @include r(960) {
                margin-bottom: 0;
            }
        }

        .flexIt {
            align-items: center;
            display: flex;
            flex-grow: 1;

            @include r(600) {
                justify-content: space-between;
            }
            @include r(768) {
                flex-direction: column;
            }
            @include r(960) {
                flex-direction: row;
            }
        }
    }

    .imgContainer {

        @include r(600) {
            width: 40%;
        }
        @include r(768) {
            width: 100%;
        }
        @include r(960) {
            width: 40%;
        }

        img {
            max-height: 16rem;
            position: relative;

            @include r(600) {
                height: auto;
                max-height: 32rem;
                max-width: 100%;
                width: auto;
            }
        }
    }

    .core-values-list {
        list-style: none;
        margin: 2.4rem 2.4rem .8rem 0;
        padding: 0;

        @include r(768) {
            margin: 0;
            width: 100%;
        }
        @include r(960) {
            margin: 0;
            width: 50%;
        }
    }

    .core-value {
        list-style: none;
        margin: 0 0 .8rem;
        padding: 0;

        @include r(600) {
            margin-bottom: 1.6rem;
        }
    }

    .bubblesContainer {
        border: 1px solid $lightest;
        border-radius: 1.6rem;
        margin: 0 2.4rem 3.2rem;
        padding: 2.4rem 2.4rem 1.6rem;

        @include r(374) {
            margin: 0 0 3.2rem;
            padding: 3.2rem 3.2rem 2.4rem;
        }
        @include r(768) {
            border: 0;
            display: block;
            flex-basis: 50%;
            padding: 3.2rem 0 3.2rem 4rem;
        }
        @include r(960) {
            flex-basis: 33%;
        }

        h2 {
            margin-bottom: 1.6rem;
        }

        .wordCloud {
            margin: -1.6rem -1.2rem -1.2rem;

            @include r(768) {
                margin: -3.2rem -1.6rem -1.6rem;
                width: calc(100% + 3.2rem);
            }
        }
    }

    // .nogapContainer + .bubblesContainer {
    //     @include r(768) {
    //         flex-basis: 50%;
    //         margin-right: 1.6rem;
    //         order: 1;
    //     }
    // }

    .focusElement {
        font-size: 2rem;
        font-weight: bold;
        text-transform: capitalize;
    }

</style>
