<template>
    <div class="insightsDash" :class="isPlusMember ? 'plus' : 'basic'">
        <div class="centered">
            <h1 v-if="!loading">{{ welcomeMessage }}</h1>
            <div v-if="loading">
                <spinner :delay="1500" message="Loading..."/>
            </div>
            <div v-else class="insightsGrid" :class="insightsGridClassNames">
                <reflection-stats-widget v-if="!showEmptyState && reflectionStats" :reflection-stats="reflectionStats"/>
                <prompt-widget :entry="todayEntry" :member="member" :loading="todayPromptLoading"/>
                <section class="bubblesContainer" v-if="hasWordCloud">
                    <div class="wordCloud">
                        <WordCloud class="word-cloud graph" v-if="hasWordCloud" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
                    </div>
                </section>
                <div class="shadyArea">
                    <div class="emotionsChart">
                        <EmotionsBarChartWidget v-if="isPlusMember" :data="emotionsChartData.data" :locked="emotionsChartLocked" :empty="emotionsChartData.isEmpty"/>
                        <router-link tag="section" class="emotionsBasic" v-else :to="pricingHref">
                            <svg class="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9F9BB8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <h2>Emotions</h2>
                            <p class="subtext">See how the emotions revealed in your notes change over time.</p>
                        </router-link>
                    </div>
                    <div class="positivityChart">
                        <PositivityRatingWidget v-if="isPlusMember" :data="positivityData.data" :locked="positivityLocked" :empty="positivityData.isEmpty"/>
                        <router-link tag="section" class="positivityBasic" v-else :to="pricingHref">
                            <svg class="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <h2>Positivity Rating</h2>
                            <p class="subtext">Understand how your notes reflect your positivity over time.</p>
                        </router-link>
                    </div>
                </div>

                <div class="valuesWrapper">
                    <core-value-results v-if="hasCoreValues" :core-values="coreValues" :show-description="false" :show-dropdown-menu="true"/>
                    <router-link v-else tag="section" class="novaluesContainer" :class="{plus: isPlusMember}" :to="coreValuesHref">
                        <svg class="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <h2>What Are Your Core Values?</h2>
                        <p class="subtext">Discover what drives your life decisions and deepest needs.</p>
                        <router-link v-if="isPlusMember" tag="button" class="secondary esButton" :to="coreValuesHref">
                            Take
                            the Assessment
                        </router-link>
                    </router-link>
                </div>
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
import { CoreValue } from "@shared/models/CoreValueTypes";
import { PageRoute } from "@shared/PageRoutes";
import { QueryParam } from "@shared/util/queryParams";
import CopyService from "@shared/copy/CopyService";
import DropdownMenu from "@components/DropdownMenu.vue";
import { getQueryParam, removeQueryParam } from "@web/util";
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
import CoreValueResults from "@components/insights/CoreValueResults.vue";
import PositivityRatingWidget from "@components/insights/PositivityRatingWidget.vue";
import { createMockPositivityData, TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";
import EmotionsBarChartWidget from "@components/insights/EmotionsBarChartWidget.vue";
import { BarChartDataPoint, mockEmotionsData } from "@shared/charts/StackedBarChartTypes";
import InsightsDataSource from "@web/datasource/InsightsDataSource";
import { ChartDataResult } from "@shared/charts/ChartTypes";

const logger = new Logger("InsightsPage");
const copy = CopyService.getSharedInstance().copy;

@Component({
    components: {
        EmotionsBarChartWidget,
        PositivityRatingWidget,
        CoreValueResults,
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
    currentElementSelection: CactusElement | null = null
    todayEntry: JournalEntry | null = null;
    todayLoaded = false;
    dataSource?: JournalFeedDataSource
    journalLoaded: boolean = false;
    showEmptyState: boolean = false;
    fromParam: string | null = null
    chartData = InsightsDataSource.shared;

    async beforeMount() {
        this.dataSource = JournalFeedDataSource.setup(this.member, { onlyCompleted: true, delegate: this })
        await this.dataSource?.start()
        await this.fetchGapResults()

        this.fromParam = getQueryParam(QueryParam.FROM);
        removeQueryParam(QueryParam.FROM);
    }

    destroyed() {
        this.todayEntry?.stop();
    }

    get todayPromptLoading(): boolean {
        return !this.todayEntry && !this.todayLoaded;
    }

    get insightsGridClassNames(): Record<string, boolean | string> {
        return {
            highlightCV: this.fromParam === "core-values"
        }
    }

    get pricingHref(): string {
        return PageRoute.PRICING;
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

    get welcomeMessage(): string {
        if (this.fromParam === "onboarding") {
            return "Welcome to Cactus!"
        } else if (this.fromParam === "core-values") {
            return "Welcome! Your Core Values:"
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

    get wordCloud(): InsightWord[] {
        return (this.member) ? (this.member?.wordCloud ?? []) : [];
    }

    get hasWordCloud(): boolean {
        return (this.wordCloud.length ?? 0) > 0;
    }

    get coreValues(): CoreValue[] {
        if (!this.member) {
            return [];
        }
        return (this.member.coreValues ?? [])
    }

    get hasCoreValues(): boolean {
        return (!!this.member) && isPremiumTier(this.member?.tier) && ((this.member?.coreValues?.length ?? 0) > 0);
    }

    get coreValuesHref(): string {
        return PageRoute.CORE_VALUES_ASSESSMENT;
    }

    get isPlusMember(): boolean {
        return !!this.member?.tier && isPremiumTier(this.member.tier);
    }

    get reflectionStats(): ReflectionStats | undefined {
        return this.member?.stats.reflections;
    }

    get focusElement(): CactusElement | null {
        return this.member.focusElement ?? null;
    }

    get positivityData(): { data: TimeSeriesDataPoint[], isEmpty: boolean } {
        const reflections = this.chartData.reflections_l14;
        // const reflections = [];
        const data = this.chartData.getPositivityChartData(reflections);
        return { data: data.data, isEmpty: data.nonEmptyCount === 0 }
    }

    get positivityLocked(): boolean {
        return this.chartData.reflections_l30.length < 0;
    }

    get emotionsChartData(): { isEmpty: boolean, data: BarChartDataPoint<Date>[] } {
        const reflections = this.chartData.reflections_l14
        // const reflections = [];
        const data: ChartDataResult<BarChartDataPoint<Date>> = this.chartData.getEmotionsChartData(reflections)
        return { data: data.data, isEmpty: data.nonEmptyCount === 0 };
    }

    get emotionsChartLocked(): boolean {
        return this.chartData.reflections_l14.length < 0;
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

.positivityChart {
    @include r(768) {
        display: flex;
        flex-basis: 50%;
        margin-right: 1.6rem;
    }

    .basic & {
        margin-bottom: 1.6rem;

        @include r(600) {
            cursor: pointer;
            transition: box-shadow .2s, transform .2s ease-in;

            &:hover {
                box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.012),
                    0 11.5px 32.3px -24px rgba(0, 0, 0, 0.036),
                    0 13.9px 37.7px -24px rgba(0, 0, 0, 0.074),
                    0 24px 63px -24px rgba(0, 0, 0, 0.15);
                transform: translateY(-.2rem);
            }
        }
        @include r(768) {
            margin-right: 0;
        }
        @include r(960) {
            margin-bottom: 0;
            margin-right: 1.6rem;
        }
    }

    .plus & {
        @include r(768) {
            margin-left: 3.2rem;
            margin-right: 0;
        }
    }
}

.emotionsChart {
    @include r(768) {
        display: flex;
        flex-basis: 50%;
        margin-right: 1.6rem;
    }

    .basic & {
        margin-bottom: 1.6rem;

        @include r(600) {
            cursor: pointer;
            transition: box-shadow .2s, transform .2s ease-in;

            &:hover {
                box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.012),
                    0 11.5px 32.3px -24px rgba(0, 0, 0, 0.036),
                    0 13.9px 37.7px -24px rgba(0, 0, 0, 0.074),
                    0 24px 63px -24px rgba(0, 0, 0, 0.15);
                transform: translateY(-.2rem);
            }
        }
        @include r(960) {
            margin-bottom: 0;
        }
    }

    .plus & {
        @include r(768) {
            margin-right: 3.2rem;
        }
    }
}

.shadyArea {
    @include r(768) {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto;
    }

    .basic & {
        margin: 0 2.4rem;

        @include r(374) {
            margin: 0;
        }
        @include r(960) {
            margin-bottom: 4.8rem;
        }
    }

    .plus & {
        background-color: $bgDolphin;
        margin-bottom: 3.2rem;
        padding: 2.4rem;

        @include r(374) {
            border-radius: 1.6rem;
        }
        @include r(768) {
            padding: 3.2rem;
            margin-bottom: 4.8rem;
        }
    }
}

.chart img {
  width: 100%;
}

.emotionsBasic {
    background: lighten($lightDolphin, 30%) url(/assets/images/emotionGraphic.svg) no-repeat right -26px top -4px;
    border-radius: 1.6rem;
    color: $dolphin;
    display: block;
    padding: 5.6rem 6.4rem 3.2rem 2.4rem;
    position: relative;
    text-decoration: none;

    @include r(960) {
        background-position: right -5px bottom -144px;
        padding-bottom: 5.6rem;
    }
}

.positivityBasic {
    background-image: url(/assets/images/grainy.png), url(/assets/images/wave.svg), linear-gradient(to right, $royal, $green);
    background-repeat: repeat, no-repeat, repeat;
    background-position: 0 0, right 0 top -24px, 0 0;
    background-size: 10rem, auto, auto;
    border-radius: 1.6rem;
    color: $white;
    display: block;
    padding: 5.6rem 2.4rem 3.2rem;
    position: relative;
    text-decoration: none;

    @include r(960) {
        padding-bottom: 5.6rem;
    }
}

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

  @include r(768) {
    margin: 6.4rem 0 4rem;
  }

  &.center {
    margin-bottom: 0;
    text-align: center;
  }
}

.insightsGrid {
  display: flex;
  flex-direction: column;
  width: 100%;

  &.highlightCV {
    .valuesWrapper {
      @include shadowbox;
      border: 0;
      order: -1;
    }
  }

  @include r(768) {
    display: grid;
    grid-template-areas: "stats stats stats stats stats stats"
        "today today today today bubbles bubbles"
        "eaCharts eaCharts eaCharts eaCharts eaCharts eaCharts"
        "values values values gap gap gap";
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: auto;
    width: auto;

    .plus & {
        grid-template-areas: "stats stats stats stats stats stats"
            "today today today today bubbles bubbles"
            "eaCharts eaCharts eaCharts eaCharts eaCharts eaCharts"
            "values values values gap gap gap";
        grid-template-columns: repeat(6, 1fr);
    }

    &.highlightCV {
        grid-template-areas:
            "values values values gap gap gap"
            "stats stats stats stats stats stats"
            "today today today today bubbles bubbles"
            "eaCharts eaCharts eaCharts eaCharts eaCharts eaCharts";
        grid-template-columns: repeat(6, 1fr);
    }

    .statsContainer {
      grid-area: stats;
    }
    .today-widget {
      grid-area: today;
    }
    .bubblesContainer {
      grid-area: bubbles;
    }
    .shadyArea {
      grid-area: eaCharts;
    }
    .valuesWrapper {
      grid-area: values;
    }
    .nogapContainer,
    .gapContainer {
      grid-area: gap;
    }
  }

  @include r(960) {
      grid-template-areas: "stats stats stats stats stats stats stats stats"
        "today today today today today bubbles bubbles bubbles"
        "eaCharts eaCharts eaCharts eaCharts values values gap gap";
      grid-template-columns: repeat(8, 1fr);
  }
}

.novaluesContainer {
  background-color: $dolphin;
  background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg);
  background-position: 0 0, -17rem -7rem, right -6rem top -4rem;
  background-repeat: repeat, no-repeat, no-repeat;
  background-size: 10rem, 28rem, auto;
  border-radius: 1.6rem;
  color: $white;
  cursor: pointer;
  padding: 5.6rem 3.2rem 3.2rem 2.4rem;
  position: relative;
  width: 100%;

  @include r(600) {
    transition: box-shadow .2s, transform .2s ease-in;

    &:hover {
      box-shadow: 0 6.9px 21px -24px rgba(0, 0, 0, 0.012),
      0 11.5px 32.3px -24px rgba(0, 0, 0, 0.036),
      0 13.9px 37.7px -24px rgba(0, 0, 0, 0.074),
      0 24px 63px -24px rgba(0, 0, 0, 0.15);
      transform: translateY(-.2rem);
    }
  }

  &.plus {
    padding: 3.2rem;

    @include r(600) {
      background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg), url(/assets/images/cvBlob.png);
      background-position: 0 0, -17rem -7rem, right -6rem top -4rem, right -6rem bottom -14rem;
      background-repeat: repeat, no-repeat, no-repeat, no-repeat;
      background-size: 10rem, 28rem, auto, auto;

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

  h2 {
      line-height: 1.2;
      margin-bottom: .8rem;
  }

  .subtext {
    max-width: 56rem;
    opacity: .8;
  }
}

.valuesWrapper {
  margin: 0 2.4rem 1.6rem;

  @include r(374) {
    margin: 0 0 1.6rem;
  }
  @include r(768) {
    display: flex;
    margin: 0 1.6rem 4.8rem 0;
  }

  .plus & {
    border: 1px solid $lightest;
    border-radius: 1.6rem;
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

.focusElement {
  font-size: 2rem;
  font-weight: bold;
  text-transform: capitalize;
}

</style>
