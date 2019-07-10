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
                <section v-if="responses.length" class="journalList">
                    <response-card
                            v-for="(response, index) in responses"
                            v-bind:response="response.response"
                            v-bind:prompt="response.prompt"
                            v-bind:index="index"
                            v-bind:key="response.id"
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


    declare interface JournalHomeData {
        user?: FirebaseUser | null,
        authUnsubscribe?: () => void,
        loginReady: boolean,
        responses: { response: ReflectionResponse, prompt?: ReflectionPrompt }[],
    }


    const response1 = new ReflectionResponse();
    response1.id = "123";
    response1.promptQuestion = "This was a hard question";
    response1.content.text = "My answer is great";
    response1.createdAt = new Date("2018-03-22");

    const response2 = new ReflectionResponse();
    response2.id = "124";
    response2.promptQuestion = "How much do you like Vue?";
    response2.content.text = "So far so good";
    response2.createdAt = new Date();

    const prompt1 = new ReflectionPrompt();
    prompt1.id = "p1";
    prompt1.contentPath = "/what-brings-out-your-playful-side";

    const mockResponses: { response: ReflectionResponse, prompt?: ReflectionPrompt }[] = [
        {response: response1},
        {response: response2, prompt: prompt1}];

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(user => {
                this.user = user;
                this.loginReady = true;
                if (!user){
                    window.location.href = "/unauthorized"
                }
            });

            setTimeout(() => {
                this.responses = mockResponses;
            }, 500);
        },
        components: {NavBar, ResponseCard},
        props: {
            loginPath: {type: String, default: PageRoute.SIGNUP}
        },
        data(): JournalHomeData {
            return {
                user: null,
                loginReady: false,
                authUnsubscribe: undefined,
                responses: []
            };
        },
        beforeDestroy() {
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
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
</style>