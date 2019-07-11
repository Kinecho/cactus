<template>
    <div>
        <NavBar :show-signup="true"/>
        <div class="container centered">
            <div v-if="!loginReady">Loading...</div>
            <div v-if="loginReady && !loggedIn">
                <h3>Oops, it looks like you're logged out.</h3>
                <div class="login-container">
                    <a class="button primary" :href="loginPath">Sign In</a>
                </div>
            </div>
            <div v-if="loggedIn">
                <section class="today" v-if="todaysPrompt">
                    <h2>Today</h2>
                    <h3 class="question">{{todaysPrompt.question}}</h3>
                </section>
                <section class="empty journalList" v-if="!preparedResponses.length">
                    You have no responses yet
                </section>
                <section v-if="preparedResponses.length" class="journalList">
                    <transition-group
                            name="fade-out"
                            tag="div"
                            appear
                            v-bind:css="false"

                            v-on:enter="enter">
                        <response-card
                                class="journalListItem"
                                v-for="(preparedResponse, index) in preparedResponses"
                                v-bind:response="preparedResponse.response"
                                v-bind:prompt="preparedResponse.prompt"
                                v-bind:index="index"
                                v-bind:key="preparedResponse.response.id"
                                v-bind:data-index="index"
                        ></response-card>
                    </transition-group>
                </section>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import {getAuth, FirebaseUser} from '@web/firebase';
    import NavBar from '@components/NavBar.vue';
    import ResponseCard from "@components/ReflectionResponseCard.vue";
    import ReflectionResponse, {ResponseMedium} from '@shared/models/ReflectionResponse';
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import {PageRoute} from '@web/PageRoutes'
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionPromptService from '@web/services/ReflectionPromptService'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'

    declare interface JournalHomeData {
        user?: FirebaseUser | null,
        cactusMember?: CactusMember,
        authUnsubscribe?: () => void,
        loginReady: boolean,
        responses: ReflectionResponse[],
        prompts: ReflectionPrompt[],
        responseUnsubscriber?: ListenerUnsubscriber,
        todaysPrompt?: ReflectionPrompt,
        todayUnsubscriber?: ListenerUnsubscriber,
        didCreateTodaysReflection: boolean,
        responsesHasLoaded: boolean,
    }

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(async user => {
                this.user = user;
                this.loginReady = true;

                this.todayUnsubscriber = ReflectionPromptService.sharedInstance.observeTodaysPrompt({
                    onData: async (updatedPrompt) => {
                        this.todaysPrompt = updatedPrompt;
                        return;
                    },
                    onDateChanged: ({unsubscriber}) => {
                        this.todayUnsubscriber = unsubscriber;
                    }
                });

                if (!user) {
                    window.location.href = "/unauthorized"
                } else {
                    this.cactusMember = await CactusMemberService.sharedInstance.getByUserId(user.uid);
                    if (!this.cactusMember) {
                        console.warn("No cactus member was found for userId", user.uid);
                    }
                }
            });
        },
        components: {NavBar, ResponseCard},
        props: {
            loginPath: {type: String, default: PageRoute.SIGNUP}
        },
        data(): JournalHomeData {
            return {
                user: null,
                cactusMember: undefined,
                loginReady: false,
                authUnsubscribe: undefined,
                responses: [],
                prompts: [],
                responseUnsubscriber: undefined,
                todaysPrompt: undefined,
                didCreateTodaysReflection: false,
                responsesHasLoaded: false
            };
        },
        watch: {
            async todaysPrompt(prompt: ReflectionPrompt | undefined | null) {
                if (prompt) {
                    await this.createTodaysReflectionIfNeeded();
                }
            },
            async responses(responses: ReflectionResponse[]) {
                this.responsesHasLoaded = true;
                await this.createTodaysReflectionIfNeeded();
            },
            async cactusMember(member: CactusMember | undefined | null) {
                if (member && member.mailchimpListMember && member.mailchimpListMember.id) {
                    const mailchimpMemberId = member.mailchimpListMember.id;
                    await this.createTodaysReflectionIfNeeded();
                    this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeForMailchimpMemberId(mailchimpMemberId, {
                        onData: async (models: ReflectionResponse[]): Promise<void> => {
                            this.responsesHasLoaded = true;
                            this.responses = models;
                            const currentPrompts = this.promptsById;
                            let promptTasks = this.responses.map(response => {
                                return new Promise(async resolve => {
                                    if (response.promptId) {
                                        if (currentPrompts[response.promptId]) {
                                            resolve();
                                            return;
                                        }
                                        const prompt = await ReflectionPromptService.sharedInstance.getById(response.promptId);
                                        if (prompt) {
                                            this.prompts.push(prompt);
                                        }
                                        resolve();
                                    }
                                })
                            });
                            await Promise.all(promptTasks);
                            await this.createTodaysReflectionIfNeeded();
                        }
                    });

                }

            }
        },
        beforeDestroy() {
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
            }

            if (this.responseUnsubscriber) {
                this.responseUnsubscriber();
            }

            if (this.todayUnsubscriber) {
                this.todayUnsubscriber();
            }
        },
        methods: {
            async createTodaysReflectionIfNeeded() {
                const prompt = this.todaysPrompt;
                if (!this.didCreateTodaysReflection && prompt && this.cactusMember && this.cactusMember.mailchimpListMember && this.responsesHasLoaded) {
                    let todaysResponse = this.responses.find(response => response.promptId === prompt.id);
                    if (!todaysResponse) {
                        todaysResponse = new ReflectionResponse();
                        todaysResponse.promptId = prompt.id;
                        todaysResponse.promptQuestion = prompt.question;
                        todaysResponse.mailchimpMemberId = this.cactusMember.mailchimpListMember.id;
                        todaysResponse.mailchimpUniqueEmailId = this.cactusMember.mailchimpListMember.unique_email_id;
                        todaysResponse.memberEmail = this.cactusMember.email;
                        todaysResponse.responseMedium = ResponseMedium.JOURNAL_WEB;
                        console.log("Creating Today's reflection prompt", todaysResponse.toJSON());
                        this.didCreateTodaysReflection = true;
                        await ReflectionResponseService.sharedInstance.save(todaysResponse);
                    }
                }
            },
            beforeEnter: function (el: HTMLElement) {
                // el.style.opacity = ".1";
            },
            enter: function (el: HTMLElement, done: () => void) {
                const delay = Number(el.dataset.index) * 100;
                console.log("delay is", delay);
                setTimeout(function () {
                    el.classList.add("in");
                    done();
                }, delay)
            },

        },
        computed: {
            userName(): string | undefined | null {
                return this.user ? this.user.displayName : null;
            },
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            },
            loggedIn(): boolean {
                return !!this.user;
            },
            promptsById(): { [id: string]: ReflectionPrompt } {
                const initialValue: { [id: string]: ReflectionPrompt } = {};
                return this.prompts.reduce((map, prompt) => {
                    if (prompt && prompt.id) {
                        const id = prompt.id;
                        map[id] = prompt;
                    }

                    return map;
                }, initialValue)
            },
            preparedResponses(): { response: ReflectionResponse, prompt?: ReflectionPrompt }[] {
                const promptsById = this.promptsById;
                return this.responses.map(response => {
                    const prompt = response.promptId ? promptsById[response.promptId] : undefined;
                    return {
                        response,
                        prompt,
                    }
                })
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";

    .container {
        /*max-width: 74rem;*/
        text-align: left;
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

    .journalList {
        display: flex;
        flex-direction: column;

        .journalListItem {
            transition: .3s all;
            width: 100%;
            /*display: inline-block;*/
            transform: translateY(30px);
            opacity: 0;
            &.in {
                opacity: 1;
                transform: translateY(0);
            }
        }

        &.empty {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin: 2rem 0;
            min-height: 12rem;
            @include shadowbox;
        }
    }
</style>