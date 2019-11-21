<template>
    <div class="wrapper">
        <NavBar/>
        <div class="centered">
            <div class="leftAlign" v-if="unsubscribeSuccess">
                <h2>Notification Settings Updated</h2>
                <p>Cactus will no longer send you <b v-if="email">({{email}})</b> new reflection prompt emails. You can start receiving them again at any time by adjusting your <a :href="accountPath">settings</a>.</p>
                <h3>Interested in Push Notifications instead?</h3>
                <p>Learn about <a href="/pricing">Cactus Premium</a></p>
                <h3>Have feedback or questions?</h3>
                <p>Email us at <a href="mailto:help@cactus.app">help@cactus.app</a></p>
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
            margin: 3.2rem;

            @include r(768) {
                margin: 6.4rem auto;
                max-width: 60rem;
            }
        }

        .leftAlign {
            text-align: left;
        }

        h2 {
            line-height: 1.1;
            margin-bottom: .8rem;
        }

        h3 {
            margin-bottom: .4rem;
        }

        p {
            margin: 0 0 3.2rem;
        }
    }

</style>
