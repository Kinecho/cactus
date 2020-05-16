<template>
    <LoadingPage v-if="showLoading"/>
    <div v-else class="error-page">
        <NavBar/>

        <div class="error-content">
            <section>
                <img class="graphic" src="/assets/images/error.png" alt="Cactus Error Image"/>
                <h1>Looks like something went wrong...</h1>
                <p>Since you're here, think of one person you'd love to get lost with.</p>
                <router-link class="button" to="/">Return Home</router-link>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Spinner from "@components/Spinner.vue";
    import Component from "vue-class-component";
    import LoadingPage from "@web/views/LoadingPage.vue";
    import { getQueryParam, removeQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import { appendQueryParams } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"

    const logger = new Logger("ErrorPage");


    @Component({
        components: {
            LoadingPage,
            NavBar,
            Spinner,
        }
    })
    export default class ErrorPage extends Vue {

        showLoading = true;

        beforeMount() {
            this.showLoading = getQueryParam(QueryParam.CLEAR_CACHE) !== "true";
            logger.info("show loading = ", this.showLoading);
            removeQueryParam(QueryParam.CLEAR_CACHE);
        }

        mounted() {
            if (this.showLoading) {

                setTimeout(() => {
                    const updatedUrl = appendQueryParams(window.location.href, { [QueryParam.CLEAR_CACHE]: "true" });
                    logger.info("reloading page", updatedUrl);
                    window.location.href = updatedUrl;
                }, 100)

            }
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .error-page {
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        background: white;
        flex: 1;

    }

    .error-content {
        background: $darkestGreen url(/assets/images/grainy.png);
        overflow-x: hidden;
        width: 100%;
        flex: 1;
        height: 100%;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    section {
        padding: 2.4rem;
    }

    .graphic {
        margin-bottom: 3.2rem;
        max-width: 100%;
        width: 50rem;
    }

    h1 {
        margin: 0;
    }

    p {
        margin: .8rem auto 4rem;
    }

</style>