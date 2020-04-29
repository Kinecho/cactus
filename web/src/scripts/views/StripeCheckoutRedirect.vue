<template>
    <div class="centered">
        <header>
            <a href="/"><img class="logo" src="/assets/images/logoWhite.svg" alt="Cactus logo"/></a>
        </header>
        <spinner v-if="loading" color="light"/>
        <section v-if="errorMessage" class="error">
            <h1>Oops! Something went wrong</h1>
            <p class="message">{{errorMessage}}</p>
            <router-link to="/home" class="button btn primary">Go Home</router-link>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import { startCheckout } from "@web/checkoutService";
    import Logger from "@shared/Logger";

    const logger = new Logger("CheckoutRedirect");

    export default Vue.extend({
        name: "StripeCheckoutRedirect",
        components: {
            Spinner,
        },
        async beforeMount() {
            document.body.classList.add("simplyCentered")

            const subscriptionProductId = getQueryParam(QueryParam.SUBSCRIPTION_PRODUCT_ID);
            if (!subscriptionProductId) {
                logger.warn("No subscription product ID found on query param. Can not forward to checkout. Showing error message");
                this.errorMessage = "It looks like this plan is no longer valid. Please try again later.";
            } else {
                this.subscriptionProductId = subscriptionProductId;
                await startCheckout({ subscriptionProductId });
            }
            this.loading = false;
        },
        beforeDestroy(): void {
            document.body.classList.remove("simplyCentered")
        },
        data(): {
            loading: boolean,
            subscriptionProductId: string | null,
            errorMessage: string | null,
        } {
            return {
                loading: true,
                subscriptionProductId: null,
                errorMessage: null,
            }
        },
        methods: {}
    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "simplyCentered";

    section {
        animation: slide 1s ease-in-out forwards;
        opacity: 0;
        transform: translateY(3.2rem);
    }

    .centered {
        overflow: visible;
    }

</style>