<template>
    <div>
        <NavBar :show-signup="true"/>
        <div class="container centered">
            <div v-if="!loginReady">Loading...</div>
            <div v-if="loginReady && !loggedIn"></div>
            <div v-if="loggedIn">
                <h1>Cactus Journal</h1>
                <ul v-if="responses.length" class="cards">
                    <response-card
                            v-for="(response, index) in responses"
                            v-bind:response="response"
                            v-bind:index="index"
                            v-bind:key="response.id"
                    ></response-card>
                </ul>
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


    declare interface JournalHomeData {
        user?: FirebaseUser | null,
        authUnsubscribe?: () => void,
        loginReady: boolean,
        responses: ReflectionResponse[],
    }


    const response1 = new ReflectionResponse();
    response1.id = "123";
    response1.promptQuestion = "This was a hard question";
    response1.content.text = "My answer is great";

    const response2 = new ReflectionResponse();
    response2.id = "124";
    response2.promptQuestion = "How much do you like Vue?";
    response2.content.text = "So far so good";

    const mockResponses: ReflectionResponse[] = [response1, response2];

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(user => {
                this.user = user;
                this.loginReady = true;
            });

            setTimeout(() => {
                this.responses = mockResponses;
            }, 500);
        },
        components: {NavBar, ResponseCard},
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
        max-width: 74rem;
    }
</style>