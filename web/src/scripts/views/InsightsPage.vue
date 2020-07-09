<template>
    <div class="insightsDash">
        <NavBar/>
        <div class="centered" v-if="authLoaded">
            <h1>Welcome back{{displayName ? ', ' + displayName : ''}}</h1>

            <div class="insightsGrid">
                <reflection-stats-widget :reflection-stats="reflectionStats" v-if="reflectionStats"/>
                <prompt-widget :entry="todayEntry" :member="member" :loading="todayPromptLoading"/>
                <section class="bubblesContainer" v-if="hasWordCloud">
                    <div class="flexIt">
                        <h2>Word Bubbles</h2>
                        <p class="subtext">Common words in your reflections</p>
                    </div>
                    <div class="wordCloud">
                        <WordCloud class="word-cloud graph" v-if="hasWordCloud" :start-blurred="false" :start-gated="false" :did-write="true" subscription-tier="PLUS" :logged-in="true" :words="wordCloud"/>
                    </div>
                </section>
                <section class="valuesContainer" v-if="hasCoreValues">
                    <h2>Core Values</h2>
                    <p class="subtext">The values important in your&nbsp;life</p>
                    <div class="flexIt">
                        <div class="imgContainer" v-if="coreValuesBlob">
                            <img :src="coreValuesBlob.imageUrl" alt="Core Values Graphic"/>
                        </div>
                        <ul class="core-values-list">
                            <li v-for="(coreValue, index) in coreValues" :key="`value_${index}`" class="core-value">
                                <h3>{{coreValue.value}}</h3>
                                <p class="description">{{coreValue.description}}</p>
                            </li>
                        </ul>
                    </div>
                    <dropdown-menu :items="coreValuesDropdownLinks" class="dotsBtn"/>
                </section>
                <section class="novaluesContainer" v-else>
                    <svg class="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <h2>Get My Core Values</h2>
                    <p class="subtext">Discover what is most important & understand yourself better.</p>
                    <!-- <router-link tag="button" class="secondary esButton" :to="coreValuesHref">Get My Core Values</router-link> -->
                </section>
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
    import NavBar from "@components/NavBar.vue";
    import WordCloud from "@components/MemberWordCloudInsights.vue";
    import CactusMember, { ReflectionStats } from "@shared/models/CactusMember";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
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
    import { pushRoute } from "@web/NavigationUtil";
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
    import PromptContent from "@shared/models/PromptContent";
    import PromptContentService from "@web/services/PromptContentService";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import JournalEntry from "@web/datasource/models/JournalEntry";
    import SvgIcon from "@components/SvgIcon.vue";

    const logger = new Logger("InsightsPage");
    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            PromptWidget,
            ReflectionStatsWidget,
            GapAnalysisWidget,
            Results,
            ResultElement,
            NavBar,
            Footer,
            WordCloud,
            DropdownMenu,
            Spinner,
            SvgIcon,
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

        todayPromptLoading = false;
        todayPromptContent: PromptContent | null = null;
        todayEntry: JournalEntry | null = null;

        beforeMount() {
            this.memberObserver = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({ member }) => {

                    if (!member) {
                        await pushRoute(PageRoute.HOME);
                        return;
                    }
                    const memberChanged = !this.member || this.member.id !== member.id

                    this.member = member ?? null;
                    this.authLoaded = true;

                    if (memberChanged) {
                        logger.info("fetching gap results because member id is different / not set")
                        await Promise.all([
                            this.fetchGapResults(),
                            this.fetchTodayPrompt()
                        ]);
                    } else {
                        logger.info("member changed but not fetching results because it's the same member");
                    }
                }
            })
        }

        destroyed() {
            this.memberObserver?.();
            this.todayEntry?.stop();
        }

        async fetchTodayPrompt() {
            this.todayPromptLoading = true;
            const promptContent = await PromptContentService.sharedInstance.getPromptContentForDate({
                subscriptionTier: this.member?.tier ?? SubscriptionTier.BASIC,
                systemDate: new Date(),
            })
            if (promptContent?.promptId) {
                this.todayEntry = new JournalEntry(promptContent.promptId);
                this.todayEntry.start();
            }
            this.todayPromptLoading = false;
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

        get displayName(): string | undefined {
            return this.member?.firstName;
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

        get isPlusMember(): boolean {
            return this.authLoaded && !!this.member?.tier && isPremiumTier(this.member.tier);
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
            .novaluesContainer {
                grid-area: values;
            }
            .nogapContainer {
                grid-area: gap;
            }
        }
    }

    .novaluesContainer {
        @include shadowbox;
        background-color: $dolphin;
        background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg);
        background-position: 0 0, -17rem -7rem, right -6rem top -4rem;
        background-repeat: repeat, no-repeat, no-repeat;
        background-size: auto, 28rem, auto;
        color: $white;
        margin: 0 2.4rem 3.2rem;
        padding: 2.4rem 3.2rem 3.2rem 5.6rem;
        position: relative;

        @include r(374) {
            margin: 0 0 3.2rem;
        }
        @include r(768) {
            margin: 0 .8rem 4.8rem 0;
        }

        .subtext {
            max-width: 56rem;
            opacity: .8;
        }

        .esButton {
            width: 100%;

            @include r(768) {
                width: auto;
            }
        }
    }

    .valuesContainer {
        background-color: $bgGreen;
        border-radius: 1.6rem;
        margin-bottom: 4rem;
        padding: 3.2rem;
        position: relative;

        @include r(768) {
            margin-bottom: 4.8rem;
        }

        .subtext {
            margin-bottom: 0;
            max-width: 16rem;

            @include r(374) {
                margin-bottom: 4rem;
            }
            @include r(768) {
                max-width: none;
            }
            @include r(1024) {
                max-width: 15rem;
            }
            @include r(1140) {
                max-width: 22rem;
            }
        }

        .flexIt {
            @include r(600) {
                align-items: center;
                display: flex;
                flex-direction: row-reverse;
                justify-content: flex-end;
            }
            @include r(1024) {
                align-items: flex-start;
                flex-direction: row;
                margin-top: -9.2rem;
            }
        }
    }

    .imgContainer {
        margin-top: 2.4rem;
        position: relative;

        @include r(374) {
            margin-bottom: 2.4rem;
            margin-top: -16rem;
            transform: translate(60%, 0);
            position: absolute;
        }
        @include r(600) {
            margin-bottom: -4.8rem;
            margin-top: -14rem;
            max-width: 60%;
            position: relative;
            transform: none;
            width: 100%;
        }
        @include r(1024) {
            margin-top: -4.8rem;
            max-width: 38rem;
            text-align: center;
        }

        img {
            position: relative;
            width: 29rem;

            @include r(600) {
                height: auto;
                max-height: 32rem;
                max-width: 32rem;
                width: auto;
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
        @include r(1024) {
            max-width: 48.75%;
        }
    }

    .core-value {
        list-style: none;
        margin: 0 0 .8rem;
        padding: 0;

        @include r(768) {
            margin: 0 2.4rem 2.4rem 0;
            width: calc(50% - 2.4rem);
        }
        @include r(1024) {
            margin: 0 0 2.4rem;
            padding-left: 3.2rem;
            width: 50%;
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

    .flexSections {
        @include r(768) {
            display: flex;
            justify-content: space-between;
        }
    }

    .bubblesContainer {
        padding: 2.4rem;
 
        @include r(374) {
            padding: 3.2rem 3.2rem 2.4rem;
        }
        @include r(600) {
            display: flex;
            flex-direction: row;
            
        }
        @include r(768) {
            display: block;
            flex-basis: 50%;
            padding: 3.2rem 0 3.2rem 4rem;
        }
        @include r(960) {
            flex-basis: 33%;
        }

        .subtext {
            margin-bottom: 1.6rem;
        }

        .wordCloud {
            margin: -1.6rem auto 0;
            max-width: 40rem;
            width: 100%;

            @include r(600) {
                width: 50%;
            }
            @include r(768) {
                margin: -3.2rem -1.6rem -1.6rem;
                width: calc(100% + 3.2rem);
            }
        }
    }

    .nogapContainer + .bubblesContainer {
        @include r(768) {
            flex-basis: 50%;
            margin-right: 1.6rem;
            order: 1;
        }
    }

    .focusElement {
        font-size: 2rem;
        font-weight: bold;
        text-transform: capitalize;
    }

</style>
