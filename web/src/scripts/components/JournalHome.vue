<template>
    <div>
        <NavBar :show-signup="false" :isSticky="false"/>
        <upgrade-card class="journalListItem" v-if="showUpgradeCard" :member="cactusMember" :hasPromptToday="(todayEntry && todayLoaded)"/>
        <snackbar-content
                class="upgrade-confirmation"
                v-if="upgradeConfirmed"
                :closeable="true"
                key="upgrade-confirmation"
                :autoHide="false"
                @close="upgradeConfirmed = false"
                color="successAlt">
            <div slot="text" class="centered">
                <h3>Welcome to Cactus Plus!</h3>
                <p>You just upgraded and it made our day. If you ever have questions or feedback, please reach out to us
                    at <a href="mailto:help@cactus.app">help@cactus.app</a>.</p>
            </div>
        </snackbar-content>
        <div class="container centered">
            <div v-if="loginReady && !loggedIn" class="section-container">
                <section class="loggedOut journalList">
                    <h3>Oops, it looks like you're logged out.</h3>
                    <div class="login-container">
                        <a class="button primary" :href="loginPath">Sign In</a>
                    </div>
                </section>
            </div>

            <transition name="fade-in-fast" appear mode="out-in">
                <div class="section-container" v-if="showOnboardingPrompt" :key="'empty'">
                    <section class="empty journalList">
                        <h1>Welcome to Cactus</h1>
                        <p>To get started, you'll learn about how Cactus works and reflect on your first question of the&nbsp;day.</p>
                        <img class="graphic" src="assets/images/emptyState.png" alt="Three friends welcoming you"/>
                        <a class="button primary" :href="firstPromptPath">Let's Begin</a>
                    </section>
                </div>
                <div class="section-container" v-if="loggedIn && loginReady && journalEntries.length > 0">
                    <!-- TODO: this key isn't right -->
                    <snackbar-content
                            v-if="showCoreValuesBanner"
                            class="coreValuesBox"
                            :closeable="true"
                            key="core-values-banner"
                            :autoHide="false"
                            @close="coreValuesClosed = true"
                            color="dolphin">
                        <div slot="text" class="centered">
                            <h3 class="cvTitle">What's important to&nbsp;you?</h3>
                            <p class="cvSubtext" v-if="!plusUser">Discover your core values by taking our
                                assessment.</p>
                            <p class="cvSubtext" v-else>Discover your core values by taking our assessment, included
                                with your Plus&nbsp;membership.</p>
                        </div>
                        <button class="cvButton" slot="action" @click="launchCoreValues">Find My Core Values</button>
                    </snackbar-content>
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
                                    :class="['journalListItem', {even: index%2}]"
                                    :style="{zIndex: Math.max(1000 - index, 0)}"
                                    v-for="(entry, index) in journalEntries"
                                    :journalEntry="entry"
                                    v-bind:index="index"
                                    v-bind:key="entry.promptId"
                                    v-bind:data-index="index"
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
    import { FirebaseUser } from '@web/firebase';
    import JournalEntryCard from "@components/JournalEntryCard.vue";
    import NavBar from '@components/NavBar.vue';
    import { PageRoute } from '@shared/PageRoutes'
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import AutoPromptContentModal from "@components/AutoPromptContentModal.vue";
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";
    import JournalFeedDataSource from '@web/datasource/JournalFeedDataSource'
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import { debounce } from "debounce"
    import Spinner from "@components/Spinner.vue"
    import PromptContentService from "@web/services/PromptContentService";
    import SentPromptService from "@web/services/SentPromptService";
    import SentPrompt from "@shared/models/SentPrompt";
    import UpgradeSubscriptionJournalEntryCard from "@components/UpgradeSubscriptionJournalEntryCard.vue";
    import Logger from "@shared/Logger";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import { QueryParam } from "@shared/util/queryParams";
    import { getQueryParam, removeQueryParam } from "@web/util";
    import SnackbarContent from "@components/SnackbarContent.vue";
    import { fireOptInStartTrialEvent } from "@web/analytics";
    import StorageService, { LocalStorageKey } from "@web/services/StorageService";

    const logger = new Logger("JournalHome.vue");

    declare interface JournalHomeData {
        cactusMember?: CactusMember,
        authUnsubscribe?: () => void,
        user?: FirebaseUser,
        memberUnsubscriber?: ListenerUnsubscriber,
        loginReady: boolean,
        dataSource?: JournalFeedDataSource,
        journalEntries: JournalEntry[],
        showPageLoading: boolean,
        dataHasLoaded: boolean,
        todayUnsubscriber?: ListenerUnsubscriber,
        todayEntry?: JournalEntry,
        todayLoaded: boolean,
        coreValuesClosed: boolean,
        upgradeConfirmed: boolean,
    }

    export default Vue.extend({
        components: {
            NavBar,
            entry: JournalEntryCard,
            AutoPromptContentModal,
            SkeletonCard,
            Spinner,
            UpgradeCard: UpgradeSubscriptionJournalEntryCard,
            SnackbarContent
        },
        props: {
            loginPath: { type: String, default: PageRoute.SIGNUP },
            firstPromptPath: { type: String, default: PageRoute.PROMPTS_ROOT + '/' + Config.firstPromptId }
        },
        mounted() {
            let handler = debounce(this.scrollHandler, 10);
            window.addEventListener('scroll', handler);
            this.scrollHandler();

            if (this.upgradeConfirmed) {
                let priceCents = StorageService.getNumber(LocalStorageKey.subscriptionPriceCents);

                if (priceCents) {
                    priceCents = priceCents / 100;
                }

                fireOptInStartTrialEvent({ value: priceCents });
            }
        },
        beforeMount() {
            logger.log("Journal Home calling Created function");

            const upgradeQueryParam = getQueryParam(QueryParam.UPGRADE_SUCCESS);
            this.upgradeConfirmed = upgradeQueryParam === 'success';
            removeQueryParam(QueryParam.UPGRADE_SUCCESS)

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({ member, user }) => {
                    if (!user) {
                        logger.log("JournalHome - auth state changed and user was not logged in. Sending to journal");
                        window.location.href = PageRoute.HOME;
                        return;
                    }
                    const isFreshLogin = !this.cactusMember && member;

                    this.cactusMember = member;
                    this.user = user;
                    if (user && member) {
                        this.loginReady = true;
                    }

                    // Query Flamelink for today's PromptContent and then back into a JournalEntry
                    if (this.cactusMember?.id) {
                        const tier = this.cactusMember?.tier ?? SubscriptionTier.PLUS;
                        const todaysPromptContent = await PromptContentService.sharedInstance.getPromptContentForDate({
                            systemDate: new Date(),
                            subscriptionTier: tier
                        });

                        if (todaysPromptContent?.promptId) {
                            this.todayUnsubscriber = SentPromptService.sharedInstance.observeByPromptId(this.cactusMember.id, todaysPromptContent.promptId, {
                                onData: async (todaySentPrompt: SentPrompt | undefined) => {
                                    let todayEntry = undefined;

                                    if (todaySentPrompt?.promptId && todaySentPrompt.completed === false) {
                                        todayEntry = new JournalEntry(todaySentPrompt.promptId, todaySentPrompt);
                                    } else if (!todaySentPrompt && todaysPromptContent?.promptId) {
                                        // they don't have a SentPrompt for today's prompt
                                        // but we show it to them anyway
                                        todayEntry = new JournalEntry(todaysPromptContent.promptId);
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
                                        this.todayEntry = undefined;
                                    }
                                }
                            });
                        } else {
                            logger.error("Today's prompt could not be found for member");
                            this.todayLoaded = true;
                        }

                        // if (tier === SubscriptionTier.BASIC) {
                        //     this.showUpgradeCard = true;
                        // }
                    }

                    if (isFreshLogin) {
                        logger.log("[JournalHome] fresh login. Setting up data source");
                        this.dataSource = new JournalFeedDataSource(member!, { onlyCompleted: true });
                        this.dataSource.delegate = {
                            didLoad: (hasData) => {
                                logger.log("[JournalHome] didLoad called. Has Data = ", hasData);

                                this.journalEntries = this.dataSource!.journalEntries;
                                this.dataHasLoaded = true;
                            },
                            updateAll: (entries) => {
                                this.journalEntries = entries;
                            },
                            onUpdated: (entry: JournalEntry, index?: number) => {
                                logger.log(`entry updated at index ${ index }`, entry);
                                if (index && index >= 0) {
                                    this.$set(this.$data.journalEntries, index, entry);
                                }

                                this.journalEntries = this.dataSource?.journalEntries || this.journalEntries
                            },
                            pageLoaded: (hasMore: boolean) => {
                                this.showPageLoading = false
                            }
                        };

                        this.dataSource?.start()
                    }
                }
            });
        },

        data(): JournalHomeData {
            return {
                cactusMember: undefined,
                loginReady: false,
                authUnsubscribe: undefined,
                dataSource: undefined,
                journalEntries: [],
                showPageLoading: false,
                dataHasLoaded: false,
                todayUnsubscriber: undefined,
                todayEntry: undefined,
                todayLoaded: false,
                coreValuesClosed: false,
                upgradeConfirmed: false,
            };
        },
        destroyed() {
            this.authUnsubscribe?.();
            this.todayUnsubscriber?.();
            this.dataSource?.stop();
        },
        methods: {
            beforeEnter: function (el: HTMLElement) {
                const index = Number(el.dataset.index);
                if (index > 10) {
                    return;
                }
                el.classList.add("out");
            },
            enter: function (el: HTMLElement, done: () => void) {
                const index = Number(el.dataset.index);
                const delay = Math.min(index * 100, 2000);

                setTimeout(function () {
                    el.classList.remove("out");
                    done();
                }, delay)
            },
            scrollHandler(): void {
                const threshold = window.innerHeight / 3;
                const distance = this.getScrollOffset();
                if (distance <= threshold) {
                    logger.log("load more! Offset = ", distance);

                    const willLoad = this.dataSource?.loadNextPage() || false;
                    this.showPageLoading = this.dataSource?.loadingPage || willLoad

                }
            },
            launchCoreValues() {
                // TODO: launch core values assessment
                window.location.href = `${ PageRoute.CORE_VALUES }?${ QueryParam.CV_LAUNCH }=true`;
            },
            getScrollOffset(): number {
                return -1 * ((window.innerHeight + document.documentElement.scrollTop) - document.body.offsetHeight)
            }
        },
        computed: {
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            },
            plusUser(): boolean {
                const tier = this.cactusMember?.tier ?? SubscriptionTier.PLUS;
                return (tier === SubscriptionTier.PLUS) ? true : false;
            },
            loggedIn(): boolean {
                return !!this.cactusMember;
            },
            isSticky(): boolean {
                return false;
            },
            hasCoreValues(): boolean {
                return (this.cactusMember?.coreValues ?? []).length > 0
            },
            showCoreValuesBanner(): boolean {
                return !this.hasCoreValues && !this.upgradeConfirmed && !this.coreValuesClosed
            },
            showUpgradeCard(): boolean {
                return !this.plusUser && !this.showCoreValuesBanner && !this.showOnboardingPrompt && this.dataHasLoaded && !this.upgradeConfirmed
            },
            showOnboardingPrompt(): boolean {
                return (this.loggedIn &&
                this.loginReady &&
                this.dataHasLoaded &&
                this.journalEntries.length === 0)
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";

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
        background-image: url(assets/images/grainy.png), url(assets/images/cvBlob.png), url(assets/images/pinkVs.svg);
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
            justify-content: center;
        }

        .journalList {
            display: flex;
            flex-direction: column;

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

                &.out {
                    transform: translateY(-30px);
                    opacity: 0;
                }
            }

            &.empty {
                align-items: center;
                justify-content: center;
                padding: 2.4rem;
                text-align: center;

                h1 {
                    line-height: 1.2;
                    margin-bottom: .4rem;
                }

                p {
                    margin: 0 auto 2.4rem;
                    max-width: 60rem;
                    opacity: .8;

                    @include r(768) {
                        margin-bottom: 1.6rem;
                    }
                }

                .graphic {
                    margin-bottom: 2.4rem;
                    max-width: 56rem;
                    width: 90%;

                    @include r(768) {
                        margin-bottom: 1.6rem;
                    }
                }

                .button {
                    min-width: 22rem;
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
