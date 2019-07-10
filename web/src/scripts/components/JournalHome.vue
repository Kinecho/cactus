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
                <section class="today journalList" v-if="todaysPrompt">
                    <h2>Today</h2>
                    <h3 class="question">{{todaysPrompt.question}}</h3>
                </section>
                <section v-if="preparedResponses.length" class="journalList">
                    <response-card
                            v-for="(preparedResponse, index) in preparedResponses"
                            v-bind:response="preparedResponse.response"
                            v-bind:prompt="preparedResponse.prompt"
                            v-bind:index="index"
                            v-bind:key="preparedResponse.response.id"
                    ></response-card>
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
    import ReflectionResponse from '@shared/models/ReflectionResponse';
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
    }

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(async user => {
                this.user = user;
                this.loginReady = true;

                this.todayUnsubscriber = ReflectionPromptService.sharedInstance.observeTodaysPrompt({
                    onData: (updatedPrompt) => {
                        console.log("updating today's prompt", updatedPrompt);
                        this.todaysPrompt = updatedPrompt;
                        return;
                    },
                    onDateChanged: ({unsubscriber}) => {
                        this.todayUnsubscriber = unsubscriber;
                    }
                });

                this.todaysPrompt = await ReflectionPromptService.sharedInstance.getTodaysPrompt();
                console.log("today's prompt is", this.todaysPrompt);
                if (!user) {
                    window.location.href = "/unauthorized"
                } else {
                    console.log("getting cactus member for user", user.uid);
                    this.cactusMember = await CactusMemberService.sharedInstance.getByUserId(user.uid);
                    console.log("fetched cactus member, found", this.cactusMember);
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
            };
        },
        watch: {
            async cactusMember(member: CactusMember | undefined | null) {
                if (member && member.mailchimpListMember && member.mailchimpListMember.id) {
                    const mailchimpMemberId = member.mailchimpListMember.id;
                    this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeForMailchimpMemberId(mailchimpMemberId, {
                        onData: async (models: ReflectionResponse[]): Promise<void> => {
                            console.log("received data from query observer. Updating fields");
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
</style>