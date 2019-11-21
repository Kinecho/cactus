<template>
    <div class="wrapper">
        <NavBar/>
        <div class="centered">
            <div v-if="unsubscribeSuccess">
                <h2>Success!</h2>
                <p>You have successfully unsubscribed <b v-if="email">{{email}}</b> from the daily Cactus emails. You can re-subscribe at any time in your <a :href="accountPath">account settings</a>.</p>
            </div>
            <div v-else>
                <h2>Something's not quite right.</h2>
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

        h2 {
            line-height: 1.1;
            margin-bottom: .8rem;
        }
    }

</style>
