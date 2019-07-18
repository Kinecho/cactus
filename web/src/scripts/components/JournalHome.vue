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
            <div v-if="loggedIn" class="section-container">
                <section class="empty journalList" v-if="!sentPrompts.length && sentPromptsLoaded">
                    <h1>Welcome to your Cactus Journal</h1>
                    <p>Your journal will soon fill with questions to reflect on each day. Your first question will arrive in the morning. For now, sit back and be confident in your choice of a healthier, happier mindset.</p>
                    <img class="graphic" src="assets/images/music2.svg" alt="" />
                </section>
                <section v-if="sentPrompts.length > 0 && sentPromptsLoaded" class="journalList">
                    <transition-group
                            name="fade-out"
                            tag="div"
                            appear
                            v-bind:css="false"
                            v-on:before-enter="beforeEnter"
                            v-on:enter="enter">
                        <entry
                                class="journalListItem"
                                v-for="(sentPrompt, index) in sentPrompts"
                                v-bind:sentPrompt="sentPrompt"
                                v-bind:index="index"
                                v-bind:key="sentPrompt.id"
                                v-bind:data-index="index"
                        ></entry>
                    </transition-group>
                </section>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import {FirebaseUser} from '@web/firebase';
    import JournalEntryCard from "@components/JournalEntryCard.vue";
    import NavBar from '@components/NavBar.vue';
    import {PageRoute} from '@web/PageRoutes'
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import SentPrompt from "@shared/models/SentPrompt"
    import SentPromptService from '@web/services/SentPromptService'

    declare interface JournalHomeData {
        cactusMember?: CactusMember,
        authUnsubscribe?: () => void,
        user?: FirebaseUser,
        memberUnsubscriber?: ListenerUnsubscriber,
        loginReady: boolean,
        sentPromptsUnsubscriber?: ListenerUnsubscriber,
        sentPrompts: SentPrompt[],
        sentPromptsLoaded: boolean,
    }

    export default Vue.extend({
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({member, user}) => {
                    if (!user) {
                        window.location.href = "/journal";
                        return;
                    }
                    this.cactusMember = member;
                    this.user = user;

                    this.loginReady = true;
                    this.sentPrompts = await SentPromptService.sharedInstance.getPrompts({limit: 10});
                    this.sentPromptsLoaded = true;
                }
            });
        },
        components: {NavBar, entry: JournalEntryCard},
        props: {
            loginPath: {type: String, default: PageRoute.SIGNUP}
        },
        data(): JournalHomeData {
            return {
                cactusMember: undefined,
                loginReady: false,
                authUnsubscribe: undefined,
                sentPromptsUnsubscriber: undefined,
                sentPrompts: [],
                sentPromptsLoaded: false,
            };
        },
        watch: {
            //TODO: add pagination
            async cactusMember(member: CactusMember | undefined | null) {
                if (member && member.id) {
                    this.sentPromptsUnsubscriber = SentPromptService.sharedInstance.observeForCactusMemberId(member.id, {
                        onData: async (sentPrompts: SentPrompt[]): Promise<void> => {
                            this.sentPrompts = sentPrompts;
                            this.sentPromptsLoaded = true;
                        }
                    });
                } else if (this.sentPromptsUnsubscriber) {
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
            beforeEnter: function (el: HTMLElement) {
                el.classList.add("out");
            },
            enter: function (el: HTMLElement, done: () => void) {
                const delay = Math.min(Number(el.dataset.index) * 200, 2000);
                console.log("delay is", delay);
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

    .container {
        text-align: left;
        padding-top: 2rem;
        padding-bottom: 2rem;
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

            .journalListItem {
                &.out {
                    transform: translateY(30px);
                    opacity: 0;
                }
            }

            &.empty {
                align-items: center;
                justify-content: center;
                padding: 2.4rem;
                text-align: center;

                p {
                  margin: 1.6rem auto 3.2rem;
                  max-width: 60rem;
                  opacity: .8;
                }

                .graphic {
                  max-width: 64rem;
                  width: 90%;
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
