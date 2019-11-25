<template>
    <div class="bgBlobs">
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
                <div class="section-container" v-if="loggedIn && loginReady && journalEntries.length === 0 && sentPromptsLoaded" :key="'empty'">
                    <section class="empty journalList">
                        <h1>Welcome to Cactus</h1>
                        <p>To get started, you'll learn about how Cactus works and reflect on your first question of the
                            day.</p>
                        <img class="graphic" src="assets/images/emptyState.png" alt="Three friends welcoming you"/>
                        <a class="button primary" :href="firstPromptPath">Let's Begin</a>
                    </section>
                </div>
                <div class="section-container" v-if="loggedIn && loginReady && sentPromptsLoaded && journalEntries.length > 0">
                    <section class="journalList">
                        <!--                        <transition-group-->
                        <!--                                tag="div"-->
                        <!--                                appear-->
                        <!--                                v-bind:css="false"-->
                        <!--                                v-on:before-enter="beforeEnter"-->
                        <!--                                v-on:enter="enter">-->
                        <virtual-list :size="220" :remain="8" :pagemode="true" ref="virtualList">
                            <entry
                                    class="journalListItem"
                                    v-for="(entry, index) in dataSource.journalEntries"
                                    :journalEntry="entry"
                                    v-bind:index="index"
                                    v-bind:key="entry.sentPrompt.id"
                                    v-bind:data-index="index"
                                    @loaded="updateIndex(index)"
                            ></entry>
                        </virtual-list>

                        <!--                        </transition-group>-->
                    </section>
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
    import SentPrompt from "@shared/models/SentPrompt"
    import SentPromptService from '@web/services/SentPromptService'
    import AutoPromptContentModal from "@components/AutoPromptContentModal.vue";
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";
    import virtualList from 'vue-virtual-scroll-list'
    // import VueVirtualScroller from "vue-virtual-scroller"
    import JournalFeedDataSource from '@web/datasource/JournalFeedDataSource'
    import JournalEntry from '@web/datasource/models/JournalEntry'

    declare interface JournalHomeData {
        cactusMember?: CactusMember,
        authUnsubscribe?: () => void,
        user?: FirebaseUser,
        memberUnsubscriber?: ListenerUnsubscriber,
        loginReady: boolean,
        sentPromptsUnsubscriber?: ListenerUnsubscriber,
        sentPrompts: SentPrompt[],
        sentPromptsLoaded: boolean,
        dataSource?: JournalFeedDataSource,
        journalEntries: JournalEntry[],
    }

    export default Vue.extend({
        components: {
            NavBar,
            entry: JournalEntryCard,
            AutoPromptContentModal,
            SkeletonCard,
            'virtual-list': virtualList,
        },
        props: {
            loginPath: {type: String, default: PageRoute.SIGNUP},
            firstPromptPath: {type: String, default: PageRoute.PROMPTS_ROOT + '/' + Config.firstPromptId}
        },
        beforeMount() {
            console.log("Journal Home calling Created function");

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({member, user}) => {
                    if (!user) {
                        console.log("JournalHome - auth state changed and user was not logged in. Sending to journal");
                        window.location.href = PageRoute.JOURNAL_MARKETING;
                        return;
                    }
                    const isFreshLogin = !this.cactusMember && member;
                    // const memberChanged =  member && member.id && this.cactusMember?.id === member?.id;

                    this.cactusMember = member;
                    this.user = user;
                    if (user && member) {
                        this.loginReady = true;
                    }

                    if (isFreshLogin) {
                        // this.sentPrompts = await SentPromptService.sharedInstance.getPrompts({limit: 10});
                        console.log(`JournalHome fetched ${this.sentPrompts.length} prompts when the current member was loaded`);
                        // this.sentPromptsLoaded = true;

                        this.dataSource = new JournalFeedDataSource(member!);
                        this.dataSource.delegate = {
                            didLoad: (hasData) => {
                                console.log("[JournalHome] didLoad called. Has Data = ", hasData);
                                this.sentPrompts = this.dataSource!.sentPrompts;
                                this.journalEntries = this.dataSource!.journalEntries;
                                this.sentPromptsLoaded = true;
                            },
                            updateAll: (entries) => {
                                console.log("got entries in journal home", entries);
                                this.journalEntries = entries;
                            },
                            onUpdated: (entry: JournalEntry, index?: number) => {
                                if (index && index >= 0) {
                                    this.updateIndex(index)
                                    // this.$forceUpdate()
                                }
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
                sentPromptsUnsubscriber: undefined,
                sentPrompts: [],
                sentPromptsLoaded: false,
                dataSource: undefined,
                journalEntries: [],
            };
        },
        watch: {
            //TODO: add pagination
            async cactusMember(newMember: CactusMember | undefined | null, oldMember: CactusMember | undefined | null) {
                const newId = newMember ? newMember.id : undefined;
                const oldId = oldMember ? oldMember.id : undefined;
                if (newId && newId !== oldId) {
                    // console.log("configuring prompt observer");
                    // this.sentPromptsUnsubscriber = SentPromptService.sharedInstance.observeForCactusMemberId(newId, {
                    //     onData: async (sentPrompts: SentPrompt[]): Promise<void> => {
                    //         console.log(`loaded ${sentPrompts.length} prompts via promptObserver on JournalHome`);
                    //
                    //         //TODO: this is a temporary hack to improve initial pageload. I need to ad infinite scrolling
                    //         setTimeout(() => this.sentPrompts = sentPrompts, 2000);
                    //         this.sentPromptsLoaded = true;
                    //     }
                    // });
                } else if (!newId && this.sentPromptsUnsubscriber) {
                    console.log("removing journal prompt subscriber since there is no current member");
                    this.sentPromptsUnsubscriber();
                }

            },
        },
        destroyed() {
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
            }
            if (this.sentPromptsUnsubscriber) {
                this.sentPromptsUnsubscriber();
            }

        },
        methods: {
            updateIndex(index: number) {
                console.log("data loaded", index);
                //@ts-ignore - stupid component doesn't have types
                this.$refs.virtualList.updateVariable(index);
            },
            beforeEnter: function (el: HTMLElement) {
                el.classList.add("out");
            },
            enter: function (el: HTMLElement, done: () => void) {
                const delay = Math.min(Number(el.dataset.index) * 100, 2000);
                setTimeout(function () {
                    el.classList.remove("out");
                    done();
                }, delay)
            },

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

    .bgBlobs {
        @include r(768) {
            background-image: url(/assets/images/leftBlobBg.svg), url(/assets/images/rightBlobBg.svg);
            background-repeat: repeat-y;
            background-size: 525px 6130px;
            background-position: -100px 0, right -80px top;
        }
    }

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
                transition: all .3s;

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
