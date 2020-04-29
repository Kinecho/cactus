<template>
    <div class="centered">
        <header>
            <router-link to="/"><img class="logo" src="/assets/images/logoWhite.svg" alt="Cactus logo" /></router-link>
        </header>
        <section>
            <img class="graphic" src="/assets/images/error.png" alt="Cactus Error Image"/>
            <h1>Looks like something went wrong...</h1>
            <p>Since you're here, think of one person you'd love to get lost with.</p>
            <router-link class="button" to="/">Return Home</router-link>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        created() {

        },
        beforeMount(): void {
            document.body.classList.add("simplyCentered");
        },
        mounted(): void {
            document.body.classList.add("simplyCentered");
        },
        beforeDestroy(): void {
            document.body.classList.remove("simplyCentered");
        },
        destroyed(): void {
            document.body.classList.remove("simplyCentered");
        },
        props: {},
        data(): {} {
            return {}
        }
    })
</script>

<style lang="scss">
    @import "simplyCentered";
</style>

<style lang="scss" scoped>
    @import "mixins";
    @import "variables";
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
        margin: 0;
    }

    p {
        margin: .8rem auto 4rem;
    }


</style>
