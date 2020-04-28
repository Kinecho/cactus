<template>
    <div class="centered">
        <header>
            <router-link to="/"><img class="logo" src="assets/images/logo.svg" alt="Cactus logo"/></router-link>
        </header>
        <section>
            <img class="graphic" src="assets/images/yogi.svg" alt=""/>
            <h1>Your payment has been canceled</h1>
            <a class="button" href="/">Return Home</a>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        name: "PaymentCanceled"
    })
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";
    @import "common";

    header {
        background-color: transparent;
        justify-content: center;
        margin-bottom: 2.4rem;
        position: static;
    }

    .centered {
        overflow-x: hidden;
        width: 100%;
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
        margin: 0 auto 4rem;
    }

</style>