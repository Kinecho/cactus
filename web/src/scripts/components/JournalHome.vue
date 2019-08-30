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
                <div v-if="!loginReady" class="loading-container" key="loading">
                    <span class="loading"><img alt="loading" src="/assets/images/loading.svg"/></span>
                </div>

                <div class="section-container" v-if="loggedIn && loginReady && !sentPrompts.length && sentPromptsLoaded" key="empty">
                    <section class="empty journalList">
                        <h1>Welcome to Cactus</h1>
                        <p>Your first Cactus prompt will be emailed to you soon. For now, sit back and be confident in
                            your choice to develop a healthier, happier mindset.</p>
                        <img class="graphic" src="assets/images/music2.svg" alt=""/>
                    </section>
                </div>

            </transition>

            <div v-if="loggedIn && loginReady" class="section-container">
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
        <auto-prompt-content-modal :autoLoad="true"/>
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
    import AutoPromptContentModal from "@components/AutoPromptContentModal.vue";
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";

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
            console.log("Journal Home calling Created function");
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({member, user}) => {
                    if (!user) {
                        console.log("JournalHome - auth state changed and user was not logged in. Sending to journal");
                        window.location.href = PageRoute.JOURNAL_MARKETING;
                        return;
                    }
                    const isFreshLogin = !this.cactusMember && member;


                    this.cactusMember = member;
                    this.user = user;
                    if (user && member) {
                        this.loginReady = true;
                    }

                    if (isFreshLogin) {
                        this.sentPrompts = await SentPromptService.sharedInstance.getPrompts({limit: 10});
                        console.log(`JournalHome fetched ${this.sentPrompts.length} prompts when the current member was loaded`);
                        this.sentPromptsLoaded = true;
                    }

                }
            });
        },
        components: {
            NavBar,
            entry: JournalEntryCard,
            AutoPromptContentModal,
            SkeletonCard,
        },
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
            async cactusMember(newMember: CactusMember | undefined | null, oldMember: CactusMember | undefined | null) {
                const newId = newMember ? newMember.id : undefined;
                const oldId = oldMember ? oldMember.id : undefined;
                if (newId && newId !== oldId) {
                    console.log("configuring prompt observer");
                    this.sentPromptsUnsubscriber = SentPromptService.sharedInstance.observeForCactusMemberId(newId, {
                        onData: async (sentPrompts: SentPrompt[]): Promise<void> => {
                            console.log(`loaded ${sentPrompts.length} prompts via promptObserver on JournalHome`);

                            //TODO: this is a temporary hack to improve initial pageload. I need to ad infinite scrolling
                            setTimeout(() => this.sentPrompts = sentPrompts, 2000);
                            this.sentPromptsLoaded = true;
                        }
                    });
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

    .loading-container {
        display: flex;
        height: 0;
        top: 4rem;
        position: relative;
        justify-content: center;
        align-items: center;

        .loading {
            width: 2rem;
            height: 2rem;
            transform-origin: center;
            animation: rotate 1s linear infinite;
        }
    }

    .section-container {

        .journalList {
            display: flex;
            flex-direction: column;

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
