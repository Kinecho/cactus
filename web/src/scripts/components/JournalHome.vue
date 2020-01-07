<template>
    <div>
        <NavBar :show-signup="false" :isSticky="false"/>
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
                <div class="section-container" v-if="loggedIn && loginReady && journalEntries.length === 0 && dataHasLoaded" :key="'empty'">
                    <section class="empty journalList">
                        <h1>Welcome to Cactus</h1>
                        <p>To get started, you'll learn about how Cactus works and reflect on your first question of the
                            day.</p>
                        <img class="graphic" src="assets/images/emptyState.png" alt="Three friends welcoming you"/>
                        <a class="button primary" :href="firstPromptPath">Let's Begin</a>
                    </section>
                </div>
                <div class="section-container" v-if="loggedIn && loginReady && journalEntries.length > 0">
                    <section class="journalList">
                        <transition-group
                                tag="div"
                                appear
                                v-bind:css="false"
                                v-on:before-enter="beforeEnter"
                                v-on:enter="enter">
                            <entry
                                    v-if="todayEntry"
                                    class="journalListItem"
                                    :journalEntry="todayEntry"
                                    v-bind:key="todayEntry.promptId"
                            ></entry>
                            <entry
                                    :class="['journalListItem', {even: index%2}]"
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
    import {Config} from "@web/config";
    import {FirebaseUser} from '@web/firebase';
    import JournalEntryCard from "@components/JournalEntryCard.vue";
    import NavBar from '@components/NavBar.vue';
    import {PageRoute} from '@shared/PageRoutes'
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import AutoPromptContentModal from "@components/AutoPromptContentModal.vue";
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";
    import JournalFeedDataSource from '@web/datasource/JournalFeedDataSource'
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import {debounce} from "debounce"
    import Spinner from "@components/Spinner.vue"
    import PromptContentService from "@web/services/PromptContentService";
    import SentPromptService from "@web/services/SentPromptService";
    import SentPrompt from "@shared/models/SentPrompt";

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
        todayEntry?: JournalEntry
    }

    export default Vue.extend({
        components: {
            NavBar,
            entry: JournalEntryCard,
            AutoPromptContentModal,
            SkeletonCard,
            Spinner,
        },
        props: {
            loginPath: {type: String, default: PageRoute.SIGNUP},
            firstPromptPath: {type: String, default: PageRoute.PROMPTS_ROOT + '/' + Config.firstPromptId}
        },
        mounted() {
            let handler = debounce(this.scrollHandler, 10);
            window.addEventListener('scroll', handler);
            this.scrollHandler();
        },
        beforeMount() {
            console.log("Journal Home calling Created function");

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({member, user}) => {
                    if (!user) {
                        console.log("JournalHome - auth state changed and user was not logged in. Sending to journal");
                        window.location.href = PageRoute.HOME;
                        return;
                    }
                    const isFreshLogin = !this.cactusMember && member;
                    // const memberChanged =  member && member.id && this.cactusMember?.id === member?.id;

                    this.cactusMember = member;
                    this.user = user;
                    if (user && member) {
                        this.loginReady = true;
                    }

                    // Query Flamelink for today's PromptContent and then back into a JournalEntry
                    if (this.cactusMember?.id) {
                        const todaysPromptContent = await PromptContentService.sharedInstance.getPromptContentForDate({systemDate: new Date()});
                        
                        if (todaysPromptContent?.promptId) {
                            this.todayUnsubscriber = SentPromptService.sharedInstance.observeByPromptId(this.cactusMember.id, todaysPromptContent.promptId, {
                                onData: async (sentPrompts: SentPrompt[]) => {
                                    const todaySentPrompt = sentPrompts[0];
                                    if (todaySentPrompt && todaySentPrompt.completed === false) {
                                        const todayEntry = new JournalEntry(todaySentPrompt);
                                        todayEntry.start();
                                        this.todayEntry = todayEntry;
                                    } else {
                                        this.todayEntry = undefined;
                                    }
                                }
                            });
                        }
                    }   

                    if (isFreshLogin) {
                        
                        if (this.cactusMember?.id) {
                            this.todayUnsubscriber = SentPromptService.sharedInstance.observeToday(this.cactusMember?.id, {
                                onData: async (sentPrompts: SentPrompt[]) => {
                                    if (sentPrompts && sentPrompts.length > 0) {
                                        const todayEntry = new JournalEntry(sentPrompts[0]);
                                        todayEntry.start();
                                        this.todayEntry = todayEntry;
                                    } else {
                                        this.todayEntry = undefined;
                                    }
                                }
                            });
                        }   

                        console.log("[JournalHome] fresh login. Setting up data source");
                        this.dataSource = new JournalFeedDataSource(member!, {onlyCompleted: false});
                        this.dataSource.delegate = {
                            didLoad: (hasData) => {
                                console.log("[JournalHome] didLoad called. Has Data = ", hasData);

                                // this.$set(this.journalEntries, this.dataSource!.journalEntries);
                                this.journalEntries = this.dataSource!.journalEntries;
                                // this.$set(this.$data.journalEntries)
                                this.dataHasLoaded = true;
                            },
                            onAdded: (entry: JournalEntry, index) => {
                                //not implemented
                            },
                            onRemoved: (entry: JournalEntry, removedIndex) => {
                                //not implemented
                            },
                            updateAll: (entries) => {
                                console.log("got entries in journal home", entries);
                                this.journalEntries = entries;
                            },
                            onUpdated: (entry: JournalEntry, index?: number) => {
                                console.log(`entry updated at index ${index}`, entry);
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
                todayEntry: undefined
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
                    console.log("load more! Offset = ", distance);

                    const willLoad = this.dataSource?.loadNextPage() || false;
                    this.showPageLoading = this.dataSource?.loadingPage || willLoad

                }
            },
            getScrollOffset(): number {
                return -1 * ((window.innerHeight + document.documentElement.scrollTop) - document.body.offsetHeight)
            }
        },
        computed: {
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            },
            loggedIn(): boolean {
                return !!this.cactusMember;
            },
            isSticky(): boolean {
                return false;
            },
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

    .section-container {

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
