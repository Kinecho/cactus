<template>
    <div>
        <NavBar :show-signup="true"/>
        <div class="container centered">
            <div v-if="loginReady && !loggedIn">
                <h3>Oops, it looks like you're logged out.</h3>
                <div class="login-container">
                    <a class="button primary" :href="loginPath">Sign In</a>
                </div>
            </div>
            <div v-if="loggedIn" class="section-container">
                <section class="empty journalList" v-if="!preparedPrompts.length && responsesHasLoaded">
                    You have not received any questions yet
                </section>
                <section v-if="preparedPrompts.length" class="journalList">
                    <transition-group
                            name="fade-out"
                            tag="div"
                            appear
                            v-bind:css="false"
                            v-on:before-enter="beforeEnter"
                            v-on:enter="enter">
                        <response-card
                                class="journalListItem"
                                v-for="(preparedPrompt, index) in preparedPrompts"
                                v-bind:response="preparedPrompt.response"
                                v-bind:prompt="preparedPrompt.prompt"
                                v-bind:index="index"
                                v-bind:key="preparedPrompt.prompt.id"
                                v-bind:data-index="index"
                        ></response-card>
                    </transition-group>
                </section>


                <section class="empty journalList" v-if="!preparedResponses.length && responsesHasLoaded">
                    You have not saved any responses yet
                </section>
                <section v-if="preparedResponses.length" class="journalList">
                    <h1 class="heading">Old Method Using Reflection Responses</h1>

                    <transition-group
                            name="fade-out"
                            tag="div"
                            appear
                            v-bind:css="false"
                            v-on:before-enter="beforeEnter"
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
    import {FirebaseUser, getAuth} from '@web/firebase';
    import NavBar from '@components/NavBar.vue';
    import ResponseCard from "@components/ReflectionResponseCard.vue";
    import ReflectionResponse from '@shared/models/ReflectionResponse';
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import {PageRoute} from '@web/PageRoutes'
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionPromptService from '@web/services/ReflectionPromptService'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import SentPrompt from "@shared/models/SentPrompt"
    import SentPromptService from '@web/services/SentPromptService'

    declare interface JournalHomeData {
        user?: FirebaseUser | null,
        cactusMember?: CactusMember,
        authUnsubscribe?: () => void,
        loginReady: boolean,
        responses: ReflectionResponse[],
        prompts: ReflectionPrompt[],
        responseUnsubscriber?: ListenerUnsubscriber,
        responsesHasLoaded: boolean,
        sentPromptsUnsubscriber?: ListenerUnsubscriber,
        sentPrompts: SentPrompt[],
        sentPromptsLoaded: boolean,
        preparedPrompts: { sentPrompt: SentPrompt, response?: ReflectionResponse, prompt: ReflectionPrompt }[]
    }

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(async user => {
                this.user = user;
                this.loginReady = true;

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
                responsesHasLoaded: false,
                sentPromptsUnsubscriber: undefined,
                sentPrompts: [],
                sentPromptsLoaded: false,
                preparedPrompts: []
            };
        },
        watch: {
            async cactusMember(member: CactusMember | undefined | null) {
                if (member && member.id) {
                    this.sentPromptsUnsubscriber = SentPromptService.sharedInstance.observeForCactusMemberId(member.id, {
                        onData: async (sentPrompts: SentPrompt[]): Promise<void> => {
                            this.sentPrompts = sentPrompts;
                            const promptIds: string[] = [];
                            sentPrompts.forEach(sent => {
                                if (sent.promptId) {
                                    promptIds.push(sent.promptId);
                                }
                            });

                            await this.fetchPromptsForIds(promptIds);

                            this.sentPromptsLoaded = true;
                        }
                    });
                }

                if (member && member.mailchimpListMember && member.mailchimpListMember.id) {
                    const mailchimpMemberId = member.mailchimpListMember.id;

                    this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeForMailchimpMemberId(mailchimpMemberId, {
                        onData: async (models: ReflectionResponse[]): Promise<void> => {
                            this.responsesHasLoaded = true;
                            this.responses = models;
                            // const currentPrompts = this.promptsById;
                            const promptIds: string[] = [];
                            this.responses.forEach(response => {
                                if (response.promptId) {
                                    promptIds.push(response.promptId);
                                }
                            });

                            if (promptIds.length > 0) {
                                await this.fetchPromptsForIds(promptIds);
                            }
                        }
                    });

                }

            },
            async prompts(): Promise<void> {
                await this.updatePreparedPrompts();
            },
            async responses(): Promise<void> {
                await this.updatePreparedPrompts();
            },
        },
        beforeDestroy() {
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
            }

            if (this.responseUnsubscriber) {
                this.responseUnsubscriber();
            }
        },
        methods: {
            async updatePreparedPrompts() {
                console.log("updating prepared prompts");
                const promptsById = this.promptsById;
                const responsesByPromptId = this.responsesByPromptId;
                console.log("responses by prompt id", responsesByPromptId);
                const member = this.cactusMember;
                const items: {
                    response?: ReflectionResponse,
                    sentPrompt: SentPrompt,
                    prompt: ReflectionPrompt
                }[] = [];

                this.sentPrompts.forEach(sentPrompt => {
                    let promptId = sentPrompt.promptId;

                    let response;
                    let prompt;
                    if (promptId) {
                        prompt = promptsById[promptId];
                        response = responsesByPromptId[promptId];
                    } else {
                        console.warn("no prompt id found on sentPrompt", sentPrompt);
                    }

                    if (!response) {
                        console.warn("no response was found");
                    }

                    if (prompt) {
                        items.push({
                            prompt,
                            response,
                            sentPrompt,
                        })
                    }
                    return;

                });

                console.log("prepared prompts", items);

                // return items;

                this.preparedPrompts = items;
            },
            async fetchPromptsForIds(promptIds: string[]): Promise<void> {
                const currentPrompts = this.promptsById;
                let promptTasks = promptIds.map(promptId => {
                    return new Promise(async resolve => {
                        if (promptId) {
                            if (currentPrompts[promptId]) {
                                resolve();
                                return;
                            }
                            const prompt = await ReflectionPromptService.sharedInstance.getById(promptId);
                            if (prompt) {
                                this.prompts.push(prompt);
                            }
                            resolve();
                        }
                    })
                });
                await Promise.all(promptTasks);
                return;
            },
            beforeEnter: function (el: HTMLElement) {

                el.classList.add("out");
            },
            enter: function (el: HTMLElement, done: () => void) {
                const delay = Number(el.dataset.index) * 100;
                console.log("delay is", delay);
                setTimeout(function () {
                    el.classList.remove("out");
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
            responsesByPromptId(): { [id: string]: ReflectionResponse } {
                const initialValue: { [id: string]: ReflectionResponse } = {};
                return this.responses.reduce((map, response) => {
                    if (response && response.promptId) {
                        map[response.promptId] = response;
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
        /*display: flex;*/
        /*flex-direction: column;*/
        /*justify-content: center;*/
        /*align-items: center;*/

        .journalList {
            display: flex;
            flex-direction: column;

            .journalListItem {
                transition: .3s all;
                width: 100%;
                /*display: inline-block;*/

                &.out {
                    transform: translateY(30px);
                    opacity: 0;
                }
            }

            &.empty {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 12rem;
                @include shadowbox;
                background: $lightGreen;
                color: $darkText;

                margin: 0 auto 4.8rem;
                max-width: 64rem;
                padding: 3.2rem;

            }
        }
    }


</style>