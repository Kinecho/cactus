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

            <div class="section-container" v-if="loggedIn && loginReady && dataLoaded">
                <section class="todayPrompt">
                    Today
                </section>
            </div>
            <div class="section-container" v-if="!dataLoaded">
                <spinner/>
            </div>
        </div>
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
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import {debounce} from "debounce"
    import Spinner from "@components/Spinner.vue"
    import PromptContentService from "@web/services/PromptContentService";
    import SentPromptService from "@web/services/SentPromptService";
    import SentPrompt from "@shared/models/SentPrompt";

    declare interface TodayHomeData {
        cactusMember?: CactusMember,
        authUnsubscribe?: () => void,
        user?: FirebaseUser,
        memberUnsubscriber?: ListenerUnsubscriber,
        loginReady: boolean,
        showPageLoading: boolean,
        sentPromptUnsubscriber?: ListenerUnsubscriber,
        todayUnsubscriber?: ListenerUnsubscriber,
        todayEntry?: JournalEntry,
        isNewMember: boolean
        sentPromptsLoaded: boolean,
        todayLoaded: boolean
    }

    export default Vue.extend({
        components: {
            NavBar,
            Spinner,
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
                                        todayEntry.delegate = {
                                            entryUpdated: entry => {
                                                if (entry.allLoaded) {
                                                    this.todayLoaded = true;
                                                    this.tryRedirectToPrompt();
                                                }
                                            }
                                        }
                                        todayEntry.start();
                                        this.todayEntry = todayEntry;
                                    } else {
                                        this.todayEntry = undefined;
                                    }
                                }
                            });
                        }

                        this.sentPromptUnsubscriber = SentPromptService.sharedInstance.observeForCactusMemberId(this.cactusMember.id, {
                            onData: async (sentPrompts: SentPrompt[]) => {
                                if (sentPrompts.length > 0) {
                                    this.isNewMember = false;
                                } else {
                                    this.isNewMember = true;
                                }
                                this.sentPromptsLoaded = true;
                                this.tryRedirectToPrompt();
                            }
                        });

                    }   
                }
            });
        },

        data(): TodayHomeData {
            return {
                cactusMember: undefined,
                loginReady: false,
                authUnsubscribe: undefined,
                showPageLoading: false,
                sentPromptUnsubscriber: undefined,
                todayUnsubscriber: undefined,
                todayEntry: undefined,
                isNewMember: false,
                sentPromptsLoaded: false,
                todayLoaded: false
            };
        },
        destroyed() {
            this.authUnsubscribe?.();
            this.todayUnsubscriber?.();
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
            dataLoaded(): boolean {
                return this.sentPromptsLoaded && 
                       this.todayLoaded;
            }
        },
        methods: {
            tryRedirectToPrompt(): void {
                if (this.dataLoaded) {
                    if (this.isNewMember) {
                        window.location.href = PageRoute.PROMPTS_ROOT + '/' + Config.firstPromptId;
                        return;
                    }
                    if (this.todayEntry?.sentPrompt && 
                        this.todayEntry.sentPrompt.completed === false &&
                        this.todayEntry.promptContent?.entryId) {
                        window.location.href = PageRoute.PROMPTS_ROOT + '/' + this.todayEntry.promptContent.entryId;
                        return;
                    } 
                }
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
