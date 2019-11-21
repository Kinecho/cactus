<template>
    <div class="wrapper">
        <NavBar/>
        <div class="centered">
            <div v-if="unsubscribeSuccess">
                <h2>Notification Settings Updated</h2>
                <p>Cactus will no longer send you <b v-if="email">({{email}})</b> new reflection prompt emails. You can start receiving them again at any time by adjusting your <a :href="accountPath">settings</a>.</p>
                <br><br>
                <p>
                    Interested in <b>Push Notifications</b> instead?<br>
                    <a href="/pricing">Learn about Cactus Premium</a>
                </p>
                <br><br>
                <p>
                    Have feedback or questions? <a href="mailto:help@cactus.app">help@cactus.app</a>
                </p>
            </div>
            <div v-else>
                <h2>Sorry, we were unable to process your request.</h2>
                <p>{{serverMessage}}</p>
            </div>
        </div>

    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import {getQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import {PageRoute} from '@shared/PageRoutes'
    import NavBar from "@components/NavBar.vue";

    export default Vue.extend({
        components: {
            NavBar,
        },
        created(){

        },
        beforeMount() {
            this.email = getQueryParam(QueryParam.EMAIL);
            this.serverMessage = getQueryParam(QueryParam.MESSAGE);
            this.unsubscribeSuccess = getQueryParam(QueryParam.UNSUBSCRIBE_SUCCESS) === "true"
        },
        props: {

        },
        data():{
            email: string|null,
            serverMessage: string|null,
            unsubscribeSuccess: boolean,
            accountPath: string
        }{
            return {
                email: null,
                serverMessage: null,
                unsubscribeSuccess: true,
                accountPath: PageRoute.ACCOUNT
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .wrapper {
        min-height: 100vh;
        .centered {
            max-width: 900px;
            margin-top: 5rem;

        }
    }

</style>
