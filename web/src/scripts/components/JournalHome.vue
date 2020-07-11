<template>
    <div>
        <upgrade-card class="journalListItem" v-if="showUpgradeCard" :member="member" :hasPromptToday="(todayEntry && todayLoaded)"/>
        <div class="container centered">
            <transition name="fade-in-fast" appear mode="out-in">
                <div class="page-loading" v-if="!dataHasLoaded">
                    <spinner message="Loading..." :delay="1200"/>
                </div>
                <div class="section-container" v-else-if="showOnboardingPrompt" :key="'empty'">
                    <journal-home-empty-state :focus-element="focusElement" :tier="tier"/>
                </div>

                <div class="section-container" v-else-if=" journalEntries.length > 0">
                    <section class="journalList">
                        <transition-group
                                tag="div"
                                appear
                                v-bind:css="false"
                                v-on:before-enter="beforeEnter"
                                v-on:enter="enter">

                            <entry
                                    class="journalListItem"
                                    v-if="todayEntry && todayLoaded"
                                    :journalEntry="todayEntry"
                                    v-bind:key="todayEntry.promptId"
                            ></entry>
                            <entry
                                    v-for="(entry, index) in journalEntries"
                                    :class="['journalListItem', {even: index%2}]"
                                    :style="{zIndex: Math.max(1000 - index, 0)}"
                                    :journalEntry="entry"
                                    :member="member"
                                    :index="index"
                                    :key="entry.promptId"
                                    :data-index="index"
                            ></entry>
                        </transition-group>

                    </section>
                    <spinner message="Loading More" v-show="showPageLoading"/>
                </div>
            </transition>

        </div>
        <auto-prompt-content-modal :autoLoad="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import { Config } from "@web/config";
    import JournalEntryCard from "@components/JournalEntryCard.vue";
    import { PageRoute } from '@shared/PageRoutes'
    import CactusMember from '@shared/models/CactusMember'
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import AutoPromptContentModal from "@components/AutoPromptContentModal.vue";
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";
    import JournalFeedDataSource, { JournalFeedDataSourceDelegate } from '@web/datasource/JournalFeedDataSource'
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import { debounce } from "debounce"
    import Spinner from "@components/Spinner.vue"
    import PromptContentService from "@web/services/PromptContentService";
    import SentPromptService from "@web/services/SentPromptService";
    import SentPrompt from "@shared/models/SentPrompt";
    import UpgradeSubscriptionJournalEntryCard from "@components/UpgradeSubscriptionJournalEntryCard.vue";
    import Logger from "@shared/Logger";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import SnackbarContent from "@components/SnackbarContent.vue";
    import JournalHomeEmptyState from "@components/JournalHomeEmptyState.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import { Prop } from "vue-property-decorator";
    import Component from "vue-class-component";
    import { isPremiumTier } from "@shared/models/MemberSubscription";

    const logger = new Logger("JournalHome.vue");

    @Component({
        components: {
            JournalHomeEmptyState,
            entry: JournalEntryCard,
            AutoPromptContentModal,
            SkeletonCard,
            Spinner,
            UpgradeCard: UpgradeSubscriptionJournalEntryCard,
            SnackbarContent
        }
    })
    export default class JournalHome extends Vue implements JournalFeedDataSourceDelegate {

        @Prop({ type: String as () => PageRoute | string, default: PageRoute.SIGNUP })
        loginPath!: PageRoute | string;

        @Prop({ type: String, required: false, default: `${ PageRoute.PROMPTS_ROOT }/${ Config.firstPromptId }` })
        firstPromptPath!: string;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        dataSource: JournalFeedDataSource | undefined = undefined;
        journalEntries: JournalEntry[] = [];
        showPageLoading: boolean = false;
        dataHasLoaded: boolean = false;
        todayUnsubscriber: ListenerUnsubscriber | undefined = undefined;
        todayEntry: JournalEntry | null = null;
        todayLoaded: boolean = false;
        coreValuesClosed: boolean = false;
        windowScrollHandler: any = undefined;

        mounted() {
            let handler = debounce(this.scrollHandler, 10);
            this.windowScrollHandler = handler;
            window.addEventListener('scroll', handler);
            this.scrollHandler();

        }

        async beforeMount() {
            logger.log("Journal Home calling Created function");

            if (this.member?.id) {
                const tier = this.member?.tier ?? SubscriptionTier.PLUS;
                const todaysPromptContent = await PromptContentService.sharedInstance.getPromptContentForDate({
                    systemDate: new Date(),
                    subscriptionTier: tier
                });

                if (todaysPromptContent?.promptId) {
                    this.todayUnsubscriber = SentPromptService.sharedInstance.observeByPromptId(this.member.id, todaysPromptContent.promptId, {
                        onData: async (todaySentPrompt: SentPrompt | undefined) => {
                            let todayEntry = undefined;

                            if (todaySentPrompt?.promptId && !todaySentPrompt.completed) {
                                todayEntry = new JournalEntry(todaySentPrompt.promptId, todaySentPrompt, this.member);
                            } else if (!todaySentPrompt && todaysPromptContent?.promptId) {
                                // they don't have a SentPrompt for today's prompt
                                // but we show it to them anyway
                                todayEntry = new JournalEntry(todaysPromptContent.promptId, undefined, this.member);
                            }

                            if (todayEntry) {
                                todayEntry.delegate = {
                                    entryUpdated: entry => {
                                        if (entry.allLoaded) {
                                            this.todayLoaded = true;
                                        }
                                    }
                                };
                                todayEntry.start();
                                this.todayEntry = todayEntry;
                            } else {
                                this.todayEntry = null;
                            }
                        }
                    });
                } else {
                    logger.error("Today's prompt could not be found for member");
                    this.todayLoaded = true;
                }
            }

            const dataSource = JournalFeedDataSource.with(this.member, { onlyCompleted: true });
            this.dataSource = dataSource;

            dataSource.delegate = this;
            dataSource.start()
        }

        /* START OF JOURNAL DATASOURCE DELEGATE */
        didLoad(hasData: boolean) {
            logger.log("[JournalHome] didLoad called. Has Data = ", hasData);
            this.journalEntries = this.dataSource?.journalEntries ?? [];
            this.dataHasLoaded = true;
        }

        updateAll(entries: JournalEntry[]) {
            this.journalEntries = entries;
        }

        onUpdated(entry: JournalEntry, index?: number) {
            if (index && index >= 0) {
                this.$set(this.$data.journalEntries, index, entry);
            }

            this.journalEntries = this.dataSource?.journalEntries || this.journalEntries
        }

        pageLoaded(hasMore: boolean) {
            this.showPageLoading = false
        }

        /* END OF JOURNAL DATASOURCE DELEGATE */

        beforeDestroy() {
            this.todayUnsubscriber?.();
            // this.dataSource?.stop();
            window.removeEventListener('scroll', this.windowScrollHandler);
        }

        beforeEnter(el: HTMLElement) {
            const index = Number(el.dataset.index);
            if (index > 10) {
                return;
            }
            el.classList.add("out");
        }

        enter(el: HTMLElement, done: () => void) {
            const index = Number(el.dataset.index);
            const delay = Math.min(index * 100, 2000);

            setTimeout(function () {
                el.classList.remove("out");
                done();
            }, delay)
        }

        scrollHandler(): void {
            const threshold = window.innerHeight / 3;
            const distance = this.getScrollOffset();
            if (distance <= threshold) {
                const willLoad = this.dataSource?.loadNextPage() || false;
                this.showPageLoading = this.dataSource?.loadingPage || willLoad

            }
        }

        getScrollOffset(): number {
            return -1 * ((window.innerHeight + document.documentElement.scrollTop) - document.body.offsetHeight)
        }


        get tier(): SubscriptionTier | null {
            return this.member?.tier ?? null;
        }

        get email(): string | null {
            return this.member?.email ?? null;
        }

        get plusUser(): boolean {
            return isPremiumTier(this.member?.tier)
        }

        get hasCoreValues(): boolean {
            return (this.member?.coreValues ?? []).length > 0
        }

        get showCoreValuesBanner(): boolean {
            return !this.hasCoreValues && !this.coreValuesClosed
        }

        get showUpgradeCard(): boolean {
            return !this.plusUser && !this.showCoreValuesBanner && !this.showOnboardingPrompt && this.dataHasLoaded;
        }

        get showOnboardingPrompt(): boolean {
            return this.dataHasLoaded && this.journalEntries.length === 0
        }

        get focusElement(): CactusElement | null {
            if (this.dataHasLoaded && this.member) {
                return this.member?.focusElement ?? null;
            }
            return null;
        }

    }
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "transitions";

    .container {
        min-height: 100vh;
        padding: 2.4rem 0;
        text-align: left;

        @include r(768) {
            padding: 6.4rem 0;
        }
    }

    .login-container {
        padding: 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
    }

    .today {
        text-align: center;
        margin-bottom: 3rem;
    }

    section .heading {
        text-align: center;
    }

    .upgrade-confirmation {
        border-radius: 0;
        display: block;
        padding: 3.2rem 2.4rem;

        .centered {
            max-width: 64rem;
        }

        h3 {
            font-size: 2.4rem;
            margin-bottom: .4rem;
        }

        p {
            opacity: .9;
        }

        a {
            @include fancyLinkLight;
        }
    }

    .coreValuesBox {
        background-image: url(/assets/images/grainy.png), url(/assets/images/cvBlob.png), url(/assets/images/pinkVs.svg);
        background-position: 0 0, -14rem -15rem, -7rem 120%;
        background-repeat: repeat, no-repeat, no-repeat;
        background-size: auto, 28rem, auto;
        border-radius: 0;
        display: block;
        margin-top: -2.4rem;
        padding: 3.2rem 2.4rem;

        @include r(768) {
            margin-top: -6.4rem;
        }

        @include r(960) {
            align-self: flex-start;
            background-position: 0 0, -8.5rem -15rem, -1rem 133%;
            border-radius: 1.2rem;
            margin: 0 2.4rem;
            padding: 6.4rem 3.2rem;
            position: sticky;
            top: 3.2rem;
            width: 30rem;
        }
    }

    .cvTitle {
        color: $white;
        font-size: 2.4rem;
        margin-bottom: .4rem;
    }

    .cvSubtext {
        color: $white;
        margin: 0 auto 1.6rem;
        max-width: 60rem;
        opacity: .9;
    }

    .cvButton {
        display: block;
        margin: 0 auto;

        @include r(960) {
            width: 100%;
        }
    }

    .section-container {

        @include r(960) {
            display: flex;
            flex-direction: row-reverse;
            justify-content: space-around;
        }

        .journalList {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 0 auto;

            @include r(600) {
                margin: 0 2.4rem;
            }
            @include r(768) {
                margin: 0 auto;
                width: 64rem;
            }

            .skeleton {
                width: 100%;
            }

            .journalListItem {
                position: relative;
                transition: all .3s;
                z-index: 0;

                @include r(374) {
                    padding: 0 2.4rem;
                }
                @include r(600) {
                    padding: 0;
                }

                &.out {
                    transform: translateY(-30px);
                    opacity: 0;
                }
            }

            &.loggedOut {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 12rem;
            }
        }
    }


</style>
